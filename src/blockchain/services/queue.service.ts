import { Injectable, Logger, OnModuleInit } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { error } from "console";

import { createClient } from "redis";
import type { RedisClientType } from "redis";
import { last } from "rxjs";



@Injectable()
export class QueueService implements OnModuleInit {
    private redisClient: RedisClientType;
    private readonly BLOCK_QUEUE = 'block_queue';
    private readonly LAST_EVENT_KEY = 'last_event'
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

    async setLastProcessedEvent(eventNumber: number) {
        try {
            await this.redisClient.set(this.LAST_EVENT_KEY, eventNumber.toString());
            this.logger.debug(`Updated last processed event to ${eventNumber}`);
        }
        catch (error) {
            this.logger.error('fail to update last processed event');
            throw error;
        }
    }

    async getLastProcessedEvent(): Promise<number | null> {
        try {
            const lastEvent = await this.redisClient.get(this.LAST_EVENT_KEY);
            return lastEvent ? parseInt(lastEvent): null;
        }
        catch (error) {
            this.logger.error('fail to get the last processed event.')
            throw error;
        }
    }
}

