import { Injectable, Logger, OnModuleInit } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { error } from "console";

import { createClient } from "redis";
import type { RedisClientType } from "redis";
import { first, last, timestamp } from "rxjs";



@Injectable()
export class QueueService implements OnModuleInit {
    private redisClient: RedisClientType;
    private readonly BLOCK_QUEUE = 'block_queue';
    private readonly LAST_EVENT_KEY = 'last_event'
    private readonly TRANSFER_CACHE_KEY = 'recent_large_transfers'
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
            return lastEvent ? parseInt(lastEvent) : null;
        }
        catch (error) {
            this.logger.error('fail to get the last processed event.')
            throw error;
        }
    }


    // async cacheTransfers(page: number, transfers: any[], total: number) {
    //     try {
    //         const cacheData = {
    //             transfers,
    //             total,
    //             timestamp: Date.now()
    //         };
    //         await this.redisClient.hSet(this.TRANSFER_CACHE_KEY, page.toString(), JSON.stringify(cacheData));
    //     }
    //     catch (error) {
    //         this.logger.error('Failed to cache transfers:', error);
    //         throw error;
    //     }
    // }

    // async getCachedTransfers(page: number): Promise<{ transfers: any[], total: number } | null> {
    //     try {
    //         const cached = await this.redisClient.hGet(this.TRANSFER_CACHE_KEY, page.toString());
    //         return cached ? JSON.parse(cached) : null;
    //     }
    //     catch (error) {
    //         this.logger.error('Failed to get cached transfers:', error);
    //         throw error;
    //     }
    // }

    // async updateTransfersCache(newTransfer: any) {
    //     try {
    //         const firstPageCache = await this.getCachedTransfers(1);
    //         if(firstPageCache) {
    //             const {transfers, total} = firstPageCache;
    //             transfers.unshift(newTransfer);
    //             transfers.pop();
    //             await this.cacheTransfers(1, transfers, total + 1);
    //         }
    //     }
    //     catch (error) {
    //         this.logger.error('Failed to update transfers cache:', error);
    //         throw error;
    //     }
    // }
}

