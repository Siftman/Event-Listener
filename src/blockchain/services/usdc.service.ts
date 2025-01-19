import { Injectable, Logger, OnModuleInit } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";


import { USDC_ABI } from "../contracts/usdc.interface";
import { BaseWeb3Service } from "./base-web3.service";
import { InjectRepository } from "@nestjs/typeorm";
import { USDCTransaction } from "../entities/usdc-transaction.entity";
import { Repository } from "typeorm";
import { TransferGateway } from "../gateways/transfer.gateway";
import { transformBlockchainData } from "../utils/transform.utils";
import { getTransactionFromOrToAttr } from "web3/lib/commonjs/eth.exports";


@Injectable()
export class USDCService extends BaseWeb3Service implements OnModuleInit {
    private contract: any;

    constructor(
        protected configService: ConfigService,
        @InjectRepository(USDCTransaction)
        private usdcTransactionRepository: Repository<USDCTransaction>,
        private transferGateway: TransferGateway
    ) {
        super(configService, USDCService.name);
    }

    async onModuleInit() {
        await this.initializeWeb3Connection();
        await this.initializeContract();
        await this.setupTransferEventListener();
    }

    private async initializeContract() {
        try {
            this.logger.log('initialize contract');
            const contractAddress = this.configService.get<string>('USDC_CONTRACT_ADDRESS');
            if (!contractAddress) {
                throw new Error('usdc contract address is not set');
            }
            if (!this.web3) {
                throw new Error('web3 is not initialized');
            }
            this.contract = new this.web3.eth.Contract(USDC_ABI, contractAddress);
            if (!this.contract) {
                throw new Error('fail to initilize contract');
            }
            this.logger.log(`usdc service initialized with contract : ${contractAddress}`);
        }
        catch (error) {
            this.logger.error('faild to initilize usdc contract: ', error)
            throw error;
        }
    }

    private async setupTransferEventListener() {
        // don't miss any events 
        // تا الان کدوم بلاک هارو گرفتم - از اخرین بلاکی که دارم تا لیتست بلاک 
        // اینجا هم میتونم کیو داشته باشیم لیتست بلاک رو از روی ردیس میخونم
        // چیزی که اینو صدا میزنه 

        // از روی همین بلاک هم بخونم برای ایونت هامون 

        try {
            this.logger.log('creating transfer event subscription');
            const events = this.contract.events.Transfer({
                fromBlock: 'latest'
                // toBlock
            });
            events.on('connected', (subscriptionId: string) => {
                this.logger.log(`transfer event subs connected with id : ${subscriptionId}`);
            })
            events.on('data', async (event: any) => {
                this.logger.log('Received Transfer event:', {
                    txHash: event.transactionHash,
                    blockNumber: event.blockNumber,
                    from: event.returnValues.from,
                    to: event.returnValues.to,
                    value: event.returnValues.value.toString()
                });
                await this.processTransferEvent(event);
            });
            events.on('error', (error: any) => {
                this.logger.error('transfer event error:', error);
                this.logger.log('attempting to reconnect transfer event listener...');
                setTimeout(() => this.setupTransferEventListener(), 5000);
            });
        }
        catch (error) {
            this.logger.error('fail to setup transfer event listener');
            throw error;
        }
    }

    private async processTransferEvent(event: any) {
        try {
            const valueInUSDC = BigInt(event.returnValues.value) / BigInt(10 ** 6);
            if (valueInUSDC <= BigInt(100_000)) {
                this.logger.debug(`skipping small transfer: ${valueInUSDC} usdc`);
                return;
            }

            const transaction = this.usdcTransactionRepository.create({
                transactionHash: event.transactionHash,
                blockNumber: event.blockNumber,
                from: event.returnValues.from,
                to: event.returnValues.to,
                value: event.returnValues.value
            });
            await this.usdcTransactionRepository.save(transaction);
            this.logger.log(`Processed enough large USDC trnasfer: ${event.transactionHash} (${valueInUSDC}) in usdc`);

            this.transferGateway.broadcastTransfer({
                transactionHash: event.transactionHash,
                blockNumber: Number(event.blockNumber),
                from: event.returnValues.from,
                to: event.returnValues.to,
                valueInUSDC: Number(valueInUSDC).toLocaleString(),
                timestamp: Date.now()
            })
            this.logger.log(` broadcasted large USDC trnasfer: ${event.transactionHash} (${valueInUSDC}) in usdc`);
        }
        catch (error) {
            this.logger.error('Error processing transfer event: ', error);
            throw error;
        }
    }

    async getTransfersForBlock(blockNumber: number) {
        try {
            const events = await this.contract.getPastEvents('Transfer', {
                fromBlock: blockNumber,
                toBlock: blockNumber
            });

            for (const event of events) {
                await this.processTransferEvent(event);
            }

            return events.map(event => ({
                transactionHash: event.transactionHash,
                from: event.returnValues.from,
                to: event.returnValues.to,
                value: event.returnValues.value.toString(),
                blockNumber: Number(event.blockNumber),
                logIndex: Number(event.logIndex)
            }));
        }
        catch (error) {
            this.logger.error(`Error getting transfers for block ${blockNumber}:`, error);
            throw error;
        }

    }

    async getTransfers(page: number, limit: number) {
        try {
            const [transfers, total] = await this.usdcTransactionRepository.findAndCount({
                order: { createdAt: 'DESC' },
                skip: (page - 1) * limit,
                take: limit
            });

            const formattedTransfers = transfers.map(transfers => ({
                ...transfers,
                valudInUSDC: (BigInt(transfers.value) / BigInt(10 ** 6)).toString(),
                valudInRawUnits: transfers.value
            }));

            return {
                data: formattedTransfers,
                meta: {
                    page,
                    limit,
                    total,
                    totalPages: Math.ceil(total / limit)
                }
            };
        }
        catch (error) {
            this.logger.error('Failed to fetch transfers:', error);
            throw error;
        }
    }
}
