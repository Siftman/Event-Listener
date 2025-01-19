import { Injectable, Logger, OnModuleInit } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";

import { createClient } from "redis";
import type { RedisClientType } from "redis";



@Injectable()
export class QueueService implements OnModuleInit {
    private redisClient: RedisClientType;
    private readonly BLOCK_QUEUE = 'block_queue';
    private readonly logger = new Logger;

    constructor(private configService: ConfigService) { }

    async onModuleInit() {
        try {
            const redisURL = this.configService.get<string>('REDIS_URL');
            this.redisClient = createClient({ url: redisURL });

            this.redisClient.on('connect', () => {
                this.logger.log('connected to redis');
            });
            this.redisClient.on('error', (error) => {
                this.logger.error('redis client error: ', error);
            });
            this.redisClient.on('end', () => {
                this.logger.warn('redis connection is ended');
            });

            await this.redisClient.connect();
            this.logger.log('redis is connected now');

        }
        catch (error) {
            this.logger.error('fail to initialize redis');
        }
    }

    async addBlockToQueue(blockNumber: string | number | bigint) {
        try {
            await this.redisClient.lPush(this.BLOCK_QUEUE, blockNumber.toString());
            this.logger.debug(`Added block ${blockNumber} to queue`);
        }
        catch (error) {
            this.logger.error('fail to add block: ', error);
            throw error;
        }
    }

    async getNextBlock(): Promise<Number | null> {
        try {
            const blockNumber = await this.redisClient.rPop(this.BLOCK_QUEUE);
            if (blockNumber) {
                this.logger.debug(`retrieve block ${blockNumber} from queue`);
            }
            return blockNumber ? parseInt(blockNumber) : null;
        }
        catch (error) {
            this.logger.error('fail to get next block from queue: ', error);
            throw error;
        }
    }
}


