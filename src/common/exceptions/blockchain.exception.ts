import { HttpException, HttpStatus } from '@nestjs/common';

export class BlockchainException extends HttpException {
    constructor(message: string) {
        super({
            statusCode: HttpStatus.SERVICE_UNAVAILABLE,
            message: message,
            error: 'Blockchain Error'
        }, HttpStatus.SERVICE_UNAVAILABLE);
    }
}

export class BlockNotFoundException extends HttpException {
    constructor(blockNumber: number) {
        super({
            statusCode: HttpStatus.NOT_FOUND,
            message: `Block ${blockNumber} not found`,
            error: 'Block Not Found'
        }, HttpStatus.NOT_FOUND);
    }
}

export class TransactionNotFoundException extends HttpException {
    constructor(txHash: string) {
        super({
            statusCode: HttpStatus.NOT_FOUND,
            message: `Transaction ${txHash} not found`,
            error: 'Transaction Not Found'
        }, HttpStatus.NOT_FOUND);
    }
} 