import { ConfigService } from "@nestjs/config";
import { Injectable, Logger, OnModuleInit } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { BlockNumberOrTag } from 'web3-types';


import Web3 from "web3";

import { QueueService } from "./queue.service";
import { Block } from "../entities/block.entity";


@Injectable()
export class BlockListenerService implements OnModuleInit {
    private web3: Web3;
    private wsProvider: any;
    private readonly logger = new Logger(BlockListenerService.name);
    private isProcessing = false;

    constructor(
        private configService: ConfigService,
        private queueService: QueueService,
        @InjectRepository(Block)
        private blockRepository: Repository<Block>,
    ) { }


    async onModuleInit() {
        await this.initializerBlockListener();
        this.startBlockProcessor();
    }

    private async initializerBlockListener() {
        try {
            const wsUrl = this.configService.get<string>('ETHEREUM_WS_URL');
            this.wsProvider = new Web3.providers.WebsocketProvider(wsUrl);
            this.web3 = new Web3(this.wsProvider);

            this.wsProvider.on('connect', () => {
                this.logger.log('ws connected successfully.');
                this.setup_Block_Header_Subscription();
            });

            this.wsProvider.on('error', (error) => {
                this.logger.error('ws error: ', error);
            });

            this.wsProvider.on('end', () => {
                this.logger.warn('ws connection ended');
            });

            const blockNumber = await this.web3.eth.getBlockNumber();
            this.logger.log(`connected to the eth network with current block: ${blockNumber}`);

        }
        catch (error) {
            this.logger.error('fail to connect to initialize listener');
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
        }
    }

    private async startBlockProcessor() {
        if (this.isProcessing) return;
        this.isProcessing = true;

        while (true) {
            try {
                this.logger.log('in process ...');
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
}