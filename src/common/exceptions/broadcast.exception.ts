import { HttpException, HttpStatus } from '@nestjs/common';


export class BroadCastException extends HttpException {
    constructor(message: string) {
        super({
            statusCode: HttpStatus.SERVICE_UNAVAILABLE,
            message: message,
            error: 'Broadcast channel does not work properly'
        }, HttpStatus.SERVICE_UNAVAILABLE);
    }
}