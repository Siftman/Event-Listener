import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import Web3 from 'web3';


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
        try {
            const url = this.configService.get<string>('ETHEREUM_WS_URL');
            if (!url) {
                throw new Error('WebSocket URL is not configured');
            }

            this.logger.log(`Initializing Web3 connection to ${url}`);
            this.wsProvider = new Web3.providers.WebsocketProvider(url);

            this.wsProvider.on('error', (error: Error) => {
                this.logger.error('WebSocket error:', error);
            });

            this.wsProvider.on('end', () => {
                this.logger.warn('WebSocket connection ended');
            });

            this.web3 = new Web3(this.wsProvider);
            const blockNumber = await this.web3.eth.getBlockNumber();
            this.logger.log(`Connected to Ethereum network. Current block: ${blockNumber}`);
        } catch (error) {
            this.logger.error('Failed to initialize Web3 connection:', error);
            throw error;
        }
    }
    public async getLatestBlock() {
        const blockNumber = await this.web3.eth.getBlockNumber();
        return blockNumber;
    }
} 