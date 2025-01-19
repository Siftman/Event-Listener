import { ConfigService } from "@nestjs/config";
import { Block } from "src/blockchain/entities/block.entity";
import { USDCTransaction } from "src/blockchain/entities/usdc-transaction.entity";
import { DataSource } from "typeorm";
import { config } from 'dotenv'


config();

const configService = new ConfigService();

export default new DataSource({
    type: 'postgres',
    host: configService.get('POSTGRES_HOST'),
    port: configService.get('POSTGRES_PORT'),
    username: configService.get('POSTGRES_USER'),
    password: configService.get('POSTGRES_PASSWORD'),
    database: configService.get('POSTGRES_DB'),
    entities: [Block, USDCTransaction],
    migrations: ['src/migrations/*.ts'],
    synchronize: false,
})
