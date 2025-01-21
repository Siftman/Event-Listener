import { ConfigService } from "@nestjs/config";
import { Injectable, Logger, OnModuleInit } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { BlockNumberOrTag } from 'web3-types';

import { retry } from "../utils/retry.utils";
import { QueueService } from "./queue.service";
import { Block } from "../entities/block.entity";
import { BaseWeb3Service } from "./base-web3.service";
import { BlockchainException, BlockNotFoundException } from "src/common/exceptions/blockchain.exception";


// we can do the same(like what I did for event) for avoid missing any block in case of server fail.
@Injectable()
export class BlockListenerService extends BaseWeb3Service implements OnModuleInit {
    private isProcessing = false;

    constructor(
        protected configService: ConfigService,
        private queueService: QueueService,
        @InjectRepository(Block)
        private blockRepository: Repository<Block>,
    ) {
        super(configService, BlockListenerService.name);
    }


    async onModuleInit() {
        this.logger.log('Blockchain service initializing...');
        try {
            await this.initializeWeb3Connection();
            await this.setupBlockHeaderSubscription();
            this.startBlockProcessor();
        }
        catch (error) {
            this.logger.error('Fail to initialize:', error);
            throw new BlockchainException('fail ro initilize bc service');
        }
    }

    private async setupBlockHeaderSubscription() {
        try {
            const subscription = await this.web3.eth.subscribe('newBlockHeaders');
            subscription.on('connected', (subscriptionId) => {
                this.logger.log('subscription connected with ID:', subscriptionId);
            })

            subscription.on('data', async (blockHeader) => {
                await this.queueService.addBlockToQueue(blockHeader.number);
            })

            subscription.on('error', (error) => {
                this.logger.error('subscription error: ', error);
            })
        }
        catch (error) {
            this.logger.error('Failed to setup subscription', error);
            throw new BlockchainException('Failed to setup block header subscription');
        }
    }

    private async startBlockProcessor() {
        if (this.isProcessing) return;
        this.isProcessing = true;

        while (true) {
            try {
                const blockNumber = await this.queueService.getNextBlock();
                if (!blockNumber) {
                    await new Promise(resolve => setTimeout(resolve, 1000));
                    continue;
                }
                const block = await retry(
                    async () => {
                        const result = await this.web3.eth.getBlock(blockNumber as BlockNumberOrTag, true);
                        if (!result) {
                            throw new BlockNotFoundException(Number(blockNumber));
                        }
                        return result;
                    }, 5, 2000)
                await this.processBlock(block);
            }
            catch (error) {
                this.logger.error(`cannot process the block: ${error}`)
                await new Promise(resolve => setTimeout(resolve, 1000));
            }
        }
    }

    private async processBlock(blockData: any) {
        try {
            const block = this.blockRepository.create({
                number: blockData.number,
                hash: blockData.hash,
                parentHash: blockData.parentHash,
                timestamp: blockData.timestamp,
                miner: blockData.miner,
                gasUsed: blockData.gasUsed.toString(),
                gasLimit: blockData.gasLimit.toString(),
                baseFeePerGas: blockData.baseFeePerGas?.toString(),
                nonce: blockData.nonce,
            });

            await this.blockRepository.save(block);
        }
        catch (error) {
            this.logger.error(`fail to proceess the block ${blockData.number}`)
            throw new BlockchainException(`Failed to process block ${blockData.number}`);
        }
    }
    public async getLatestBlock() {
        return await retry(
            async () => {
                const result = await this.web3.eth.getBlockNumber();
                if (!result) {
                    throw new BlockchainException('Cannot get the last block');
                }
                return result;
            }, 5, 1000)
    }

    public async getBlocks(page: number, limit: number) {
        try {
            const [blocks, total] = await this.blockRepository.findAndCount({
                order: { number: 'DESC' },
                skip: (page - 1) * limit,
                take: limit
            });

            return {
                data: blocks,
                meta: {
                    page,
                    limit,
                    total,
                    totalPages: Math.ceil(total / limit)
                }
            };
        }
        catch (error) {
            this.logger.error('fail to fetch block', error);
            throw error;
        }
    }
}
