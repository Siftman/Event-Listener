import { ConfigService } from "@nestjs/config";
import { Injectable, OnModuleInit, Logger } from "@nestjs/common";
import { transformBlockchainData } from "./utils/transform.utils";

import Web3 from 'web3';


@Injectable()
export class BlockchainService implements OnModuleInit {
    private web3: Web3;
    private readonly logger = new Logger(BlockchainService.name)
    private wsProvider: any; 

    constructor(private configService: ConfigService) {}

    async onModuleInit() {
        await this.initializeWeb3Connection();
    } 

    private async initializeWeb3Connection() {
        try {
            const wsUrl = this.configService.get<string>('ETHEREUM_WS_URL')
            if (!wsUrl) {
                throw new Error('Websocket url is not correct')
            }
            this.wsProvider = new Web3.providers.WebsocketProvider(wsUrl); 

            this.wsProvider.on('error', (error: Error) => {
                this.logger.error('Websocket error:', error);
            });

            this.wsProvider.on('end', () => {
                this.logger.warn('websocket connection ended')
            })

            this.web3 = new Web3(this.wsProvider)
            const blockNumber = await this.web3.eth.getBlockNumber();
            this.logger.log(`connected tp Ethereum network. block number: ${blockNumber}`)
        } catch (error) {
            this.logger.error('Failed to connect to Web3:', error);
            throw error;
        }
    }

    async getLatestBlock() {
        try {
            if (!this.web3 || !this.wsProvider.connected) {
                await this.initializeWeb3Connection();
            }
            const block = await this.web3.eth.getBlock('latest');
            return transformBlockchainData(block);
        } catch (error) {
            this.logger.error('Error fetching latest block:', error);
            throw error;
        }
        }
}