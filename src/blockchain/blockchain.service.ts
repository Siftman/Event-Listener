import { Injectable, OnModuleInit, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
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

        const wsUrl = this.configService.get<string>('ETHEREUM_WS_URL')

        this.wsProvider = new Web3.providers.WebsocketProvider(wsUrl); 

        this.wsProvider.on('error', (error: Error) => {
            this.logger.error('Websocket error:', error);
        });

        this.wsProvider.on('end', () => {
            this.logger.warn('websocket connection ended')
        })

        this.web3 = new Web3(this.wsProvider)
        const blockNumber = await this.web3.eth.getBlockNumber();
        this.logger.log(`connected to Ethereum network. block number: ${blockNumber}`)
    
    }
}