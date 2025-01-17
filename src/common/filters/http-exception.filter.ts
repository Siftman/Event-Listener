import {
    ExceptionFilter,
    Catch,
    ArgumentsHost,
    HttpException,
} from '@nestjs/common';

import { response, Response } from 'express';

@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
    catch(exception: HttpException, host: ArgumentsHost) {
        const ctx = host.switchToHttp();
        const Response = ctx.getResponse<Response>();
        const status = exception.getStatus();
        const exceptionResponse = exception.getResponse();

        response.status(status).json({
            statusCode: status,
            timestamp: new Date().toISOString(),
            messsage: typeof exceptionResponse === 'string' ? exceptionResponse : (exceptionResponse as any).messsage || exception.message,
        });
    }
}