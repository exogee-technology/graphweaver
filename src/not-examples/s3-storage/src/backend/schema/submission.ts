import { GraphQLEntity, Field, ID, Entity, ReadOnlyProperty } from '@exogee/graphweaver';
import {
	S3StorageProvider,
	StorageType,
	MediaField,
	MediaTypes,
} from '@exogee/graphweaver-storage-provider';
import { MikroBackendProvider } from '@exogee/graphweaver-mikroorm';

import { Submission as OrmSubmission } from '../entities';
import { pgConnection } from '../database';

if (!process.env.AWS_S3_BUCKET) throw new Error('Missing required env AWS_S3_BUCKET');

const s3 = new S3StorageProvider({
	bucketName: process.env.AWS_S3_BUCKET,
	region: process.env.AWS_REGION,
	type: StorageType.S3,
	expiresIn: 3600,
});

@Entity('Submission', {
	provider: new MikroBackendProvider(OrmSubmission, pgConnection),
})
export class Submission extends GraphQLEntity<OrmSubmission> {
	public dataEntity!: OrmSubmission;

	@Field(() => ID)
	id!: string;

	@ReadOnlyProperty({ adminUI: true, backend: false })
	@Field(() => String, { nullable: true })
	key?: string;

	// "resourceId" must match the name of the field on the entity that gets the url from s3
	@MediaField({ storageProvider: s3, resourceId: 'key', mediaType: MediaTypes.IMAGE })
	downloadUrl?: string;
}
