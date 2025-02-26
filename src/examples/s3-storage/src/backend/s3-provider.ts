import { S3StorageProvider, StorageType } from '@exogee/graphweaver-storage-provider';

export const s3Provider = new S3StorageProvider({
	bucketName: process.env.AWS_S3_BUCKET,
	region: process.env.AWS_REGION,
	type: StorageType.S3,
	expiresIn: 3600,
	endpoint: process.env.AWS_S3_ENDPOINT,
});
