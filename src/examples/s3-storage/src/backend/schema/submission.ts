import { GraphQLEntity, Field, ID, Entity } from '@exogee/graphweaver';
import {
	S3StorageProvider,
	StorageType,
	MediaField,
	Media,
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
	endpoint: process.env.AWS_S3_ENDPOINT,
});

@Entity('Submission', {
	provider: new MikroBackendProvider(OrmSubmission, pgConnection),
})
export class Submission extends GraphQLEntity<OrmSubmission> {
	public dataEntity!: OrmSubmission;

	@Field(() => ID, { primaryKeyField: true })
	id!: string;

	@MediaField({ storageProvider: s3 })
	image?: Media;
}
