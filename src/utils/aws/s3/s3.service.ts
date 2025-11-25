import {Injectable, Logger} from '@nestjs/common';
import {S3Client, PutObjectCommandOutput} from '@aws-sdk/client-s3';
import {ConfigService} from '@nestjs/config';
import {AwsS3Config, Config} from 'src/config/types';

export type S3UploadResult = {
    success: boolean;
    key: string;
    originalFileName: string;
    contentType: string;
    data?: PutObjectCommandOutput;
    error?: any;
};

// 허용된 파일 타입 정의
const ALLOWED_MIME_TYPES = [
    // 이미지
    'image/jpeg', // .jpg, .jpeg
    'image/png', // .png
    // 동영상
    'video/mp4', // .mp4
];

@Injectable()
export class S3Service {
    private readonly logger = new Logger(S3Service.name);
    private readonly s3: S3Client;
    private readonly awsS3Config: AwsS3Config;

    constructor(configService: ConfigService<Config>) {
        this.awsS3Config = configService.get('stayConfig.aws.s3', {infer: true});
        this.s3 = new S3Client(this.awsS3Config.userProfile);
    }

    getCloudFrontUrl(key: string): string {
        let cloudFrontDomain = this.awsS3Config.userProfile.cloudFrontDomain;
        if (cloudFrontDomain.endsWith('/')) {
            cloudFrontDomain = cloudFrontDomain.slice(0, -1);
        }
        return `${cloudFrontDomain}/${key}`;
    }
}
