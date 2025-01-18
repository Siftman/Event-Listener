import { Injectable, OnModuleInit } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";

import { createClient } from "redis";
import type { RedisClientType } from "redis";


@Injectable()
export class QueueService implements OnModuleInit {
    private redisClient: RedisClientType;
    private readonly BLOCK_QUEUE = 'block_queue';

    constructor(private configService: ConfigService) { }

    async onModuleInit() {
        const redisURL = this.configService.get<string>('REDIS_URL');
        this.redisClient = createClient({ url: redisURL });
        this.redisClient.on('error', (err) => console.error('redis error', err));
        await this.redisClient.connect();
    }

    async addBlockToQueue(blockNumber: string | number | bigint) {
        await this.redisClient.lPush(this.BLOCK_QUEUE, blockNumber.toString());
    }

    async getNextBlock(): Promise<Number | null> {
        const blockNumber = await this.redisClient.rPop(this.BLOCK_QUEUE);
        return blockNumber ? parseInt(blockNumber) : null;
    }
}


