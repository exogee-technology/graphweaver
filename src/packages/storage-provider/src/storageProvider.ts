import { GetObjectCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { graphweaverMetadata, ID, BaseContext } from '@exogee/graphweaver';
import { GraphQLResolveInfo, Source } from 'graphql';

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

export class S3StorageProvider {
	bucketName: string;
	region: string | undefined;
	expiresIn: number;

	constructor(config: StorageConfig) {
		this.bucketName = config.bucketName;
		this.region = config.region;
		this.expiresIn = config.expiresIn || EXPIRE_TIME;

		graphweaverMetadata.addQuery({
			name: 'getUploadUrl',
			getType: () => String,
			resolver: this.getUploadUrl.bind(this),
			args: {
				key: ID,
			},
		});

		graphweaverMetadata.addQuery({
			name: 'getDownloadUrl',
			getType: () => String,
			resolver: this.getDownloadUrl.bind(this),
			args: {
				key: ID,
			},
		});
	}

	async getUploadUrl(
		_source: Source,
		{ key }: { key: string },
		_ctx: BaseContext,
		_info: GraphQLResolveInfo
	): Promise<string> {
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

	async getDownloadUrl(
		_source: Source,
		{ key }: { key: string },
		_ctx: BaseContext,
		_info: GraphQLResolveInfo
	): Promise<string> {
		if (!this.bucketName) throw new Error('Missing required env AWS_S3_BUCKET');

		const s3 = new S3Client({
			region: this.region,
		});

		const command = new GetObjectCommand({ Bucket: this.bucketName, Key: key });
		const downloadURL = getSignedUrl(s3, command, { expiresIn: this.expiresIn });

		return downloadURL;
	}
}
