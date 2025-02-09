import { TypeOrmModuleOptions } from "@nestjs/typeorm";
import { ConfigService } from '@nestjs/config';

import { Block } from '../blockchain/entities/block.entity';
import { USDCTransaction } from "src/blockchain/entities/usdc-transaction.entity";

export const databaseConfig = (configService: ConfigService): TypeOrmModuleOptions => ({
    type: 'postgres',
    host: configService.get('POSTGRES_HOST'),
    port: configService.get('POSTGRES_PORT'),
    username: configService.get('POSTGRES_USER'),
    password: configService.get('POSTGRES_PASSWORD'),
    database: configService.get('POSTGRES_DB'),
    entities: [Block, USDCTransaction],
    synchronize: true,
    autoLoadEntities: true,
});