import { GraphQLEntity, Field, ID, ObjectType, Root } from '@exogee/graphweaver';
import { S3StorageProvider, StorageType } from '@exogee/graphweaver-storage-provider';
import { GraphQLJSON } from '@exogee/graphweaver-scalars';

import { Submission as OrmSubmission } from '../../entities';

@ObjectType('Submission')
export class Submission extends GraphQLEntity<OrmSubmission> {
	public dataEntity!: OrmSubmission;

	@Field(() => ID)
	id!: string;

	@Field(() => String)
	key!: string;

	@Field(() => String, { nullable: true })
	downloadUrl(@Root() submission: Submission) {
		if (!process.env.AWS_S3_BUCKET) throw new Error('Missing required env AWS_S3_BUCKET');
		const s3 = new S3StorageProvider({
			bucketName: process.env.AWS_S3_BUCKET,
			region: process.env.AWS_REGION,
			type: StorageType.S3,
			expiresIn: 3600,
		});

		return s3.getDownloadUrl(submission.key);
	}
}
