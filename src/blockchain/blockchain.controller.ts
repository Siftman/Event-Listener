import { Controller, Get, HttpException, HttpStatus, Param, ParseIntPipe, Query } from "@nestjs/common";
import { ApiOperation, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger'

import { BlockListenerService } from "./services/block-listener.service";
import { USDCService } from "./services/usdc.service";
import { PaginationDto } from "src/common/dto/pagination.dto";


@ApiTags('blockchain')
@Controller('api')
export class BlockchainController {
    constructor(
        private readonly blockListenerService: BlockListenerService,
        private readonly usdcService: USDCService
    ) { }

    @Get('blocks')
    @ApiOperation({ summary: 'list of stored blocks' })
    @ApiResponse({ status: 200, description: 'return a list of blocks with pagination' })
    async getBlocks(@Query() paginationDto: PaginationDto) {
        try {
            return await this.blockListenerService.getBlocks(paginationDto.page, paginationDto.limit);
        }
        catch (error) {
            throw new HttpException({
                status: HttpStatus.INTERNAL_SERVER_ERROR,
                error: error.message
            }, HttpStatus.INTERNAL_SERVER_ERROR)
        }
    }

    @Get('transfers')
    @ApiOperation({ summary: 'list of large USDC transfers' })
    @ApiResponse({ status: 200, description: 'return a list of large usdc transfers with pagination' })
    async getTransfers(@Query() paginationDto: PaginationDto) {
        try {
            return await this.usdcService.getTransfers(paginationDto.page, paginationDto.limit);
        }
        catch (error) {
            throw new HttpException({
                status: HttpStatus.INTERNAL_SERVER_ERROR,
                error: error.message
            }, HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    @Get('transfers/:blockNumber')
    @ApiOperation({ summary: 'get usdc transfers for a specific block' })
    @ApiResponse({ status: 200, description: 'return USDC transfers for the specified block' })
    async getTransfersByBlock(@Param('blockNumber', ParseIntPipe) blockNumber: number) {
        try {
            const transfers = await this.usdcService.getTransfersForBlock(blockNumber);
            return {
                blockNumber,
                transfers,
                count: transfers.length
            };
        }
        catch (error) {
            throw new HttpException({
                status: HttpStatus.INTERNAL_SERVER_ERROR,
                error: error.message
            }, HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    @Get('latest-block')
    @ApiOperation({ summary: 'Get latest block number' })
    @ApiResponse({ status: 200, description: 'Returns the latest block number' })
    async getLatestBlock() {
        try {
            return await this.blockListenerService.getLatestBlock();
        } catch (error) {
            throw new HttpException({
                status: HttpStatus.INTERNAL_SERVER_ERROR,
                error: error.message
            }, HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
}


// controller ba rpc ham bezanm
// custome error for fetch block
