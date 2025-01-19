import { Controller, Get, HttpException, HttpStatus } from "@nestjs/common";
import { BaseWeb3Service } from "./services/base-web3.service";
import { BlockListenerService } from "./services/block-listener.service";


@Controller('blockchain')
export class BlockchainController {
    constructor(private readonly blockListenerService: BlockListenerService ) {}

    @Get('latest-block')
    getLatestBlock() {
        return this.blockListenerService.getLatestBlock();
    }
}