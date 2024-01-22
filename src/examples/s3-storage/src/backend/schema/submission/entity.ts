import { GraphQLEntity, Field, ID, ObjectType, ReadOnlyProperty } from '@exogee/graphweaver';
import {
	S3StorageProvider,
	StorageType,
	DownloadUrlField,
	MediaTypes,
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

	@ReadOnlyProperty({ adminUI: true, backend: false })
	@Field(() => String, { nullable: true })
	key?: string;

	// "key" must match the name of the field on the entity that gets the url from s3
	@DownloadUrlField({ storageProvider: s3, resourceId: 'key', mediaType: MediaTypes.IMAGE })
	downloadUrl?: string;
}
