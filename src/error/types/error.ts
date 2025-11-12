import {HttpException, HttpExceptionOptions, HttpStatus} from '@nestjs/common';
import {ApiProperty} from '@nestjs/swagger';

type ErrorCode =
    | 'BAD_REQUEST_ERROR'
    | 'INVALID_ARGUMENT_ERROR'
    | 'INTERNAL_SERVER_ERROR'
    | 'UNAUTHORIZED'
    | 'ORDER_BAD_REQUEST_ERROR'
    | 'SEND_BIRD_API_ERROR'
    | 'SEND_BIRD_UNKNOWN_ERROR'
    | 'ORDER_STATUS_FORBIDDEN_ERROR'
    | 'TRADING_API_ERROR'
    | 'FORBIDDEN';

const errorCodeMap: Record<ErrorCode, HttpStatus> = {
    BAD_REQUEST_ERROR: HttpStatus.BAD_REQUEST,
    INVALID_ARGUMENT_ERROR: HttpStatus.BAD_REQUEST,
    ORDER_BAD_REQUEST_ERROR: HttpStatus.BAD_REQUEST,
    INTERNAL_SERVER_ERROR: HttpStatus.INTERNAL_SERVER_ERROR,
    UNAUTHORIZED: HttpStatus.UNAUTHORIZED,
    SEND_BIRD_API_ERROR: HttpStatus.BAD_REQUEST,
    SEND_BIRD_UNKNOWN_ERROR: HttpStatus.INTERNAL_SERVER_ERROR,
    ORDER_STATUS_FORBIDDEN_ERROR: HttpStatus.FORBIDDEN,
    TRADING_API_ERROR: HttpStatus.SERVICE_UNAVAILABLE,
    FORBIDDEN: HttpStatus.FORBIDDEN,
};

export interface ApiErrorResponse {
    error_code: ErrorCode;
    details?: Record<string, string>;
    message?: string;
}

/**
 * 공통 에러 정의
 */
export class ApiError extends HttpException {
    @ApiProperty({description: '에러 코드', enum: ['BAD_REQUEST_ERROR', 'INVALID_ARGUMENT_ERROR', 'INTERNAL_SERVER_ERROR', 'UNAUTHORIZED']})
    error_code: ErrorCode;

    @ApiProperty({description: '에러 상세 정보', type: Object})
    details: Record<string, string>;

    @ApiProperty({description: '에러 메시지', type: String})
    message: string;

    constructor(response: ApiErrorResponse, options?: HttpExceptionOptions) {
        const statusCode = errorCodeMap[`${response.error_code}`];
        super(response, statusCode, options);

        this.error_code = response.error_code;
        this.details = response.details;
        this.message = response.message;
    }
}

export class SendBirdApiError extends ApiError {
    responseData: any;

    constructor(errorCode: 'SEND_BIRD_API_ERROR' | 'SEND_BIRD_UNKNOWN_ERROR', responseData: any) {
        console.log(`60c669f7-21d3-45de-a9d7-1b7cfe770aa3, ${JSON.stringify(responseData)}`);
        const details: Record<string, string> = {code: responseData.code.toString()};
        const message = responseData.message;
        super({error_code: errorCode, details, message});
        this.responseData = responseData;
    }
}
