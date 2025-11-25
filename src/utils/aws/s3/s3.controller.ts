import {Controller, UseGuards} from '@nestjs/common';
import {S3Service} from './s3.service';

@Controller('upload')
export class S3Controller {
    constructor(private readonly s3Service: S3Service) {}
}
