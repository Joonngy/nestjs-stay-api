import {ValidationError, ValidationPipe as NestValidationPipe} from '@nestjs/common';
import {HttpErrorByCode} from '@nestjs/common/utils/http-error-by-code.util';
import {ApiError, ApiErrorResponse} from '../error/types/error';

export class CustomValidationPipe extends NestValidationPipe {
    public createExceptionFactory(): (validationErrors: ValidationError[]) => unknown {
        return (validationErrors: ValidationError[]) => {
            if (this.isDetailedOutputDisabled) {
                return new HttpErrorByCode[this.errorHttpStatusCode]();
            }

            const exceptionObj = this.getExceptionObj(validationErrors);

            return new ApiError(exceptionObj);
        };
    }

    private getExceptionObj(validationErrors: ValidationError[]): ApiErrorResponse {
        if (validationErrors.length === 0) {
            throw new ApiError({error_code: 'INTERNAL_SERVER_ERROR', details: {error_id: '302ce322-5063-4d09-a3dc-78f0770d0c97'}});
        }

        const exceptionObj: ApiErrorResponse = {
            error_code: 'INVALID_ARGUMENT_ERROR',
            details: {},
        };

        validationErrors.forEach((error) => {
            this.processValidationError(error, exceptionObj.details);
        });

        return exceptionObj;
    }

    private processValidationError(error: ValidationError, details: Record<string, any>, prefix = ''): void {
        const propertyPath = prefix ? `${prefix}.${error.property}` : error.property;

        if (error.constraints) {
            details[propertyPath] = 'invalid';
        }

        if (error.children && error.children.length > 0) {
            error.children.forEach((childError) => {
                this.processValidationError(childError, details, propertyPath);
            });
        }
    }
}
