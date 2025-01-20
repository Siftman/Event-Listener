import { Injectable, Logger, OnModuleInit } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";


import { BaseWeb3Service } from "./base-web3.service";
import { QueueService } from "./queue.service";
import { USDC_ABI } from "../contracts/usdc.interface";
import { USDCTransaction } from "../entities/usdc-transaction.entity";
import { TransferGateway } from "../gateways/transfer.gateway";
import { BlockchainException } from "src/common/exceptions/blockchain.exception";


@Injectable()
export class USDCService extends BaseWeb3Service implements OnModuleInit {
    private contract: any;

    constructor(
        protected configService: ConfigService,
        @InjectRepository(USDCTransaction)
        private usdcTransactionRepository: Repository<USDCTransaction>,
        private transferGateway: TransferGateway,
        private queueService: QueueService
    ) {
        super(configService, USDCService.name);
    }

    async onModuleInit() {
        try {
            await this.initializeWeb3Connection();
            await this.initializeContract();
            await this.setupTransferEventListener();
        }
        catch (error) {
            throw new BlockchainException('fail to initlize usdc service');
        }
    }

    private async initializeContract() {
        try {
            const contractAddress = this.configService.get<string>('USDC_CONTRACT_ADDRESS');
            if (!contractAddress) {
                throw new BlockchainException('USDC contract address not configured');
            }
            if (!this.web3) {
                throw new BlockchainException('Web3 not initialized');
            }
            this.contract = new this.web3.eth.Contract(USDC_ABI, contractAddress);
            if (!this.contract) {
                throw new BlockchainException('Failed to initialize contract');
            }
            this.logger.log(`usdc service initialized with contract : ${contractAddress}`);
        }
        catch (error) {
            this.logger.error('faild to initilize usdc contract: ', error)
            throw new BlockchainException('failed to initialize USDC contract');
        }
    }

    private async setupTransferEventListener() {
        try {
            this.logger.log('creating transfer event subscription');

            const lastProcessedEvent = await this.queueService.getLastProcessedEvent() || 'latest';
            this.logger.log(`Creating Transfer event subscription from block ${lastProcessedEvent}...`);

            const events = this.contract.events.Transfer({
                fromBlock: lastProcessedEvent
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
            throw new BlockchainException('Transfer event subscription error');
        }
    }


    // private async 
    private async processTransferEvent(event: any) {
            const valueInUSDC = BigInt(event.returnValues.value) / BigInt(10 ** 6);
            if (valueInUSDC <= BigInt(100_000)) {
                this.logger.debug(`skipping small transfer: ${valueInUSDC} usdc`);
                return;
            }
            try {
                const transaction = this.usdcTransactionRepository.create({
                    transactionHash: event.transactionHash,
                    blockNumber: event.blockNumber,
                    from: event.returnValues.from,
                    to: event.returnValues.to,
                    value: event.returnValues.value
                });
                await this.usdcTransactionRepository.save(transaction);
            }
            catch (error) {
                throw new BlockchainException('fail to save the transaction into db')
            }

            this.logger.log(`Processed enough large USDC trnasfer: ${event.transactionHash} (${valueInUSDC}) in usdc`);

            try {

                this.transferGateway.broadcastTransfer({
                    transactionHash: event.transactionHash,
                    blockNumber: Number(event.blockNumber),
                    from: event.returnValues.from,
                    to: event.returnValues.to,
                    valueInUSDC: Number(valueInUSDC).toLocaleString(),
                    timestamp: Date.now()
                })
                this.logger.log(` broadcasted large USDC trnasfer: ${event.transactionHash} (${valueInUSDC}) in usdc`);   
                await this.queueService.setLastProcessedEvent(Number(event.blockNumber));
            }
            catch(error) {

            }
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
            throw new BlockchainException(`Failed to get transfers for block ${blockNumber}`);
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
            throw new BlockchainException('Failed to retrieve transfer history');
        }
    }
}
