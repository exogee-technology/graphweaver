import { GetObjectCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { Arg, ID, Mutation, Query, Resolver } from '@exogee/graphweaver';

export enum StorageType {
	S3 = 's3',
}

type StorageConfig = {
	type: StorageType;
	bucketName: string;
	region?: string;
	expiresIn?: number;
};

const EXPIRE_TIME = 3600;

@Resolver()
export class S3StorageResolver {
	bucketName: string;
	region: string | undefined;
	expiresIn: number;

	constructor(private config: StorageConfig) {
		this.bucketName = config.bucketName;
		this.region = config.region;
		this.expiresIn = config.expiresIn || EXPIRE_TIME;
	}

	@Mutation(() => String)
	async getUploadUrl(@Arg('key', () => ID) key: string): Promise<string> {
		if (!this.bucketName) throw new Error('Missing required env AWS_S3_BUCKET');

		const s3 = new S3Client({
			region: this.region,
		});

		const command = new PutObjectCommand({
			Bucket: this.bucketName,
			Key: key,
		});

		const uploadURL = await getSignedUrl(s3, command, { expiresIn: this.expiresIn });
		return uploadURL;
	}
}

@Resolver()
export class S3StorageProvider {
	bucketName: string;
	region: string | undefined;
	expiresIn: number;

	constructor(private config: StorageConfig) {
		this.bucketName = config.bucketName;
		this.region = config.region;
		this.expiresIn = config.expiresIn || EXPIRE_TIME;
	}
	@Query(() => String)
	async getDownloadUrl(@Arg('key', () => ID) key: string): Promise<string> {
		if (!this.bucketName) throw new Error('Missing required env AWS_S3_BUCKET');

		const s3 = new S3Client({
			region: this.region,
		});

		const command = new GetObjectCommand({ Bucket: this.bucketName, Key: key });
		const downloadURL = getSignedUrl(s3, command, { expiresIn: this.expiresIn });

		return downloadURL;
	}
}
