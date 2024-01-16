import { GraphQLEntity, Field, ID, ObjectType, Root } from '@exogee/graphweaver';
import {
	S3StorageProvider,
	StorageType,
	DownloadUrlField,
	MediaType,
} from '@exogee/graphweaver-storage-provider';

import { Submission as OrmSubmission } from '../../entities';

if (!process.env.AWS_S3_BUCKET) throw new Error('Missing required env AWS_S3_BUCKET');

const s3 = new S3StorageProvider({
	bucketName: process.env.AWS_S3_BUCKET,
	region: process.env.AWS_REGION,
	type: StorageType.S3,
	expiresIn: 3600,
});

@ObjectType('Submission')
export class Submission extends GraphQLEntity<OrmSubmission> {
	public dataEntity!: OrmSubmission;

	@Field(() => ID)
	id!: string;

	@Field(() => String)
	key!: string;

	// "key" must match the name of the field on the entity that gets the url from s3
	@DownloadUrlField({ storageProvider: s3, key: 'key', mediaType: MediaType.IMAGE })
	downloadUrl!: string;
}
