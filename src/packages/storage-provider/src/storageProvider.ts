import {
	GetObjectCommand,
	PutObjectCommand,
	S3Client,
	DeleteObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { graphweaverMetadata, BaseContext } from '@exogee/graphweaver';
import { GraphQLResolveInfo, Source } from 'graphql';
import { GraphQLJSON } from '@exogee/graphweaver-scalars';
import { randomUUID } from 'crypto';
import { MediaType } from './decorators/media-field';

export enum StorageType {
	S3 = 's3',
}

type StorageConfig = {
	type: StorageType;
	bucketName: string;
	region?: string;
	expiresIn?: number;
	endpoint?: string;
};

const EXPIRE_TIME = 3600;

const getMediaType = (ext: string) => {
	// if image extension return image type
	if (['png', 'jpeg', 'jpg', 'gif'].includes(ext)) {
		return MediaType.IMAGE;
	}
	return MediaType.OTHER;
};

export class S3StorageProvider {
	bucketName: string;
	region: string | undefined;
	expiresIn: number;
	endpoint?: string;

	constructor(config: StorageConfig) {
		this.bucketName = config.bucketName;
		this.region = config.region;
		this.expiresIn = config.expiresIn || EXPIRE_TIME;
		this.endpoint = config.endpoint;

		graphweaverMetadata.addMutation({
			name: 'getUploadUrl',
			getType: () => GraphQLJSON,
			resolver: this.getUploadUrl.bind(this),
			args: {
				key: String,
			},
		});

		graphweaverMetadata.addMutation({
			name: 'getDeleteUrl',
			getType: () => String,
			resolver: this.getDeleteUrl.bind(this),
			args: {
				key: String,
			},
		});

		graphweaverMetadata.addQuery({
			name: 'getDownloadUrl',
			getType: () => String,
			resolver: this.getDownloadUrl.bind(this),
			args: {
				key: String,
			},
		});
	}

	async getUploadUrl(
		_source: Source,
		{ key }: { key: string },
		_ctx: BaseContext,
		_info: GraphQLResolveInfo
	): Promise<{ url: string; filename: string; type: MediaType }> {
		if (!this.bucketName) throw new Error('Missing required env AWS_S3_BUCKET');

		const s3 = new S3Client({
			region: this.region,
			...(this.endpoint ? { endpoint: this.endpoint } : {}),
		});

		const fileExtension = key.split('.').pop();
		if (!fileExtension) {
			throw new Error('Invalid file extension');
		}

		// generate uuid from crypto module
		const uuid = randomUUID();

		const command = new PutObjectCommand({
			Bucket: this.bucketName,
			Key: `${uuid}.${fileExtension}`,
		});

		const uploadURL = await getSignedUrl(s3, command, { expiresIn: this.expiresIn });
		return {
			url: uploadURL,
			filename: `${uuid}.${fileExtension}`,
			type: getMediaType(fileExtension),
		};
	}

	async getDeleteUrl(
		_source: Source,
		{ key }: { key: string },
		_ctx: BaseContext,
		_info: GraphQLResolveInfo
	): Promise<string> {
		if (!this.bucketName) throw new Error('Missing required env AWS_S3_BUCKET');

		const s3 = new S3Client({
			region: this.region,
			...(this.endpoint ? { endpoint: this.endpoint } : {}),
		});

		const command = new DeleteObjectCommand({
			Bucket: this.bucketName,
			Key: key,
		});

		return getSignedUrl(s3, command, { expiresIn: this.expiresIn });
	}

	async getDownloadUrl(
		_source: Source,
		{ key }: { key: string },
		_ctx?: BaseContext,
		_info?: GraphQLResolveInfo
	): Promise<string> {
		if (!this.bucketName) throw new Error('Missing required env AWS_S3_BUCKET');

		const s3 = new S3Client({
			region: this.region,
			...(this.endpoint ? { endpoint: this.endpoint } : {}),
		});

		const command = new GetObjectCommand({
			Bucket: this.bucketName,
			Key: key,
		});
		return getSignedUrl(s3, command, { expiresIn: this.expiresIn });
	}
}
