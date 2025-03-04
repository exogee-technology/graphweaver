import { Entity, Field, ID } from '@exogee/graphweaver';
import { MikroBackendProvider } from '@exogee/graphweaver-mikroorm';
import { GraphweaverMedia, MediaField } from '@exogee/graphweaver-storage-provider';

import { pgConnection } from '../database';
import { Submission as OrmSubmission } from '../entities';
import { s3Provider } from '../s3-provider';

if (!process.env.AWS_S3_BUCKET) throw new Error('Missing required env AWS_S3_BUCKET');

@Entity('Submission', {
	provider: new MikroBackendProvider(OrmSubmission, pgConnection),
})
export class Submission {
	@Field(() => ID)
	id!: string;

	@MediaField({ storageProvider: s3Provider })
	image?: GraphweaverMedia;
}
