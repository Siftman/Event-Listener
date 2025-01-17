import { Controller, Get, HttpException, HttpStatus } from "@nestjs/common";
import { BlockchainService } from "./blockchain.service";


@Controller('blockchain')
export class BlockchainController {
    constructor(private readonly blockchainService: BlockchainService) {}

    @Get('latest-block')
    getLatestBlock() {
        console.log("BC controller works fine");
    }
}