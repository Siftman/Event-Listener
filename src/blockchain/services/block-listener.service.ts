import { ConfigService } from "@nestjs/config";
import { Injectable, Logger, OnModuleInit } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { BlockNumberOrTag } from 'web3-types';


import Web3 from "web3";

import { QueueService } from "./queue.service";
import { Block } from "../entities/block.entity";
import { BaseWeb3Service } from "./base-web3.service";
import { Matches } from "class-validator";


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
            await this.setup_Block_Header_Subscription();
            this.startBlockProcessor();
        }
        catch (error) {
            this.logger.error('Fail to initialize:', error);
            throw error;
        }
    }

    private async setup_Block_Header_Subscription() {
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
            throw error;
        }
    }

    private async startBlockProcessor() {
        if (this.isProcessing) return;
        this.isProcessing = true;

        while (true) {
            try {
                const blockNumber = await this.queueService.getNextBlock();
                if (!blockNumber) {
                    this.logger.log('no block to process. waiting ...');
                    await new Promise(resolve => setTimeout(resolve, 1000));
                    continue;
                }
                this.logger.log(`processing block ${blockNumber}...`)

                const block = await this.web3.eth.getBlock(blockNumber as BlockNumberOrTag, true);
                await this.processBlock(block);
                this.logger.log(`block ${blockNumber} processed successfully.`)
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
            this.logger.log(`block number ${block.number} is processed!`)
        }
        catch (error) {
            this.logger.error(`fail to proceess the block ${blockData.number}`)
            throw error;
        }
    }

    public async getLatestBlock() {
        return await this.web3.eth.getBlockNumber();
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