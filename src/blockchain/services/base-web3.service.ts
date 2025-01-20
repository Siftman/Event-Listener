import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import Web3 from 'web3';

import { retry } from '../utils/retry.utils';
import { BlockchainException } from 'src/common/exceptions/blockchain.exception';



export abstract class BaseWeb3Service {
    protected web3: Web3;
    protected wsProvider: any;
    protected readonly logger: Logger;

    constructor(
        protected configService: ConfigService,
        serviceName: string
    ) {
        this.logger = new Logger(serviceName);
    }

    protected async initializeWeb3Connection() {
        const url = this.configService.get<string>('ETHEREUM_WS_URL');
        if (!url) {
            throw new Error('WebSocket URL is not configured');
        }
        await retry(
            async () => {
                this.wsProvider = new Web3.providers.WebsocketProvider(url);
                this.web3 = new Web3(this.wsProvider);
                const blockNumber = await this.web3.eth.getBlockNumber();
                if (!blockNumber) {
                    throw new BlockchainException('websocket connection cannot return latest block.')
                }
            },5, 2000)
    }
    protected async getLatestBlock() {
        const blockNumber = await this.web3.eth.getBlockNumber();
        return blockNumber;
    }
} 
