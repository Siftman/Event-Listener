import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Block } from './entities/block.entity';

import { QueueService } from './services/queue.service';

import { BlockchainController } from './blockchain.controller';
import { BlockListenerService } from './services/block-listener.service';
import { USDCService } from './services/usdc.service';
import { USDCTransaction } from './entities/usdc-transaction.entity';

@Module({
    imports: [
        ConfigModule,
        TypeOrmModule.forFeature([Block, USDCTransaction])
    ],
    providers: [
        QueueService,
        BlockListenerService,
        USDCService
    ],
    controllers: [BlockchainController],
    exports: [],
})
export class BlockchainModule { }