import {
    ExceptionFilter,
    Catch,
    ArgumentsHost,
    HttpException,
    HttpStatus,
} from '@nestjs/common';
import { Response } from 'express';
import { ThrottlerException } from '@nestjs/throttler';

@Catch(HttpException, ThrottlerException)
export class HttpExceptionFilter implements ExceptionFilter {
    catch(exception: HttpException | ThrottlerException, host: ArgumentsHost) {
        const ctx = host.switchToHttp();
        const response = ctx.getResponse<Response>();

        if (exception instanceof ThrottlerException) {
            return response.status(HttpStatus.TOO_MANY_REQUESTS).json({
                statusCode: HttpStatus.TOO_MANY_REQUESTS,
                timestamp: new Date().toISOString(),
                message: 'Rate limit exceeded. Please try again later.',
                error: 'Too Many Requests'
            });
        }

        const status = exception instanceof HttpException ? exception.getStatus() : HttpStatus.INTERNAL_SERVER_ERROR;
        const exceptionResponse = exception instanceof HttpException ? exception.getResponse() : undefined;

        return response.status(status).json({
            statusCode: status,
            timestamp: new Date().toISOString(),
            message: typeof exceptionResponse === 'string' ? exceptionResponse : (exceptionResponse as any)?.message || exception.message,
            error: typeof exceptionResponse === 'string' ? 'Error' : (exceptionResponse as any)?.error || exception.name
        });
    }
}