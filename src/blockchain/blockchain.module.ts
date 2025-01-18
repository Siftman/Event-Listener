import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Block } from './entities/block.entity';

import { BlockchainService } from './blockchain.service';
import { QueueService } from './services/queue.service';

import { BlockchainController } from './blockchain.controller';
import { BlockListenerService } from './services/block-listener.service';

@Module({
    imports: [
        ConfigModule,
        TypeOrmModule.forFeature([Block])
    ],
    providers: [
        BlockchainService,
        QueueService,
        BlockListenerService
    ],
    controllers: [BlockchainController],
    exports: [BlockchainService],
})
export class BlockchainModule { }