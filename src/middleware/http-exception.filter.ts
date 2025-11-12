import {ArgumentsHost, Catch, ExceptionFilter, HttpStatus, Logger, NotFoundException} from '@nestjs/common';
import {Request, Response} from 'express';
import {ApiError, SendBirdApiError} from '../error/types/error';

/**
 * error filter 정의
 */
@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
    private readonly logger = new Logger(HttpExceptionFilter.name);

    catch(exception: any, host: ArgumentsHost) {
        const ctx = host.switchToHttp();
        const response = ctx.getResponse<Response>();
        const request = ctx.getRequest<Request>();

        this.exceptionLogger(exception, request);
        if (exception instanceof ApiError) {
            const status = exception.getStatus();

            response.status(status).json({
                errorCode: exception.error_code,
                details: exception.details,
                message: exception.message,
            });
        } else if (exception instanceof NotFoundException) {
            response.status(HttpStatus.NOT_FOUND).json({errorCode: 'NOT_FOUND_ERROR'});
        } else {
            response.status(HttpStatus.INTERNAL_SERVER_ERROR).json({errorCode: 'INTERNAL_SERVER_ERROR'});
        }
    }

    private exceptionLogger(exception: ApiError, request: Request) {
        const errorCode = exception.error_code;
        if (errorCode === 'INVALID_ARGUMENT_ERROR') {
            const reqObj = {
                method: request.method,
                body: request.method === 'POST' ? JSON.stringify(request.body) : undefined,
                params: request.method === 'GET' ? JSON.stringify(request.params) : undefined,
                query: request.method === 'GET' ? JSON.stringify(request.query) : undefined,
            };
            this.logger.error(errorCode + JSON.stringify(reqObj));
        } else if (errorCode === 'BAD_REQUEST_ERROR' || errorCode === 'INTERNAL_SERVER_ERROR') {
            this.logger.error(errorCode, exception.stack);
        } else if (errorCode === 'UNAUTHORIZED') {
            this.logger.error(errorCode);
        } else if (errorCode === 'SEND_BIRD_API_ERROR' || errorCode === 'SEND_BIRD_UNKNOWN_ERROR') {
            this.logger.error(errorCode + JSON.stringify((exception as SendBirdApiError).responseData));
        } else {
            this.logger.error(exception, exception.stack);
        }
    }
}
