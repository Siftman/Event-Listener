import { Injectable, Logger, OnModuleInit } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";


import { USDC_ABI } from "../contracts/usdc.interface";
import { BaseWeb3Service } from "./base-web3.service";


@Injectable()
export class USDCService extends BaseWeb3Service implements OnModuleInit {
    private contract: any;

    constructor(
        protected configService: ConfigService,
    ) {
        super(configService, USDCService.name)
    }

    async onModuleInit() {
        try {
            const contractAddress = this.configService.get<string>('USDC_CONTRACT_ADDRESS');
            if (!contractAddress) {
                throw new Error('cannot find usdc addr');
            }

            await this.initializeWeb3Connection();
            this.logger.log('initializing usdc contract')

            this.contract = new this.web3.eth.Contract(
                USDC_ABI,
                contractAddress
            );

            this.logger.log(`USDC Service is initialized with contract: ${contractAddress}`);
        }
        catch (error) {
            this.logger.error('fail to initialize usdc service');
            throw error;
        }
    }
}