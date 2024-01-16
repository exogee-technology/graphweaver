import { GraphQLEntity, Field, ID, ObjectType, Root } from '@exogee/graphweaver';
import { S3StorageProvider, StorageType } from '@exogee/graphweaver-storage-provider';

import { Submission as OrmSubmission } from '../../entities';
import { GraphQLJSON } from '@exogee/graphweaver-scalars';

@ObjectType('Submission')
export class Submission extends GraphQLEntity<OrmSubmission> {
	public dataEntity!: OrmSubmission;

	@Field(() => ID)
	id!: string;

	@Field(() => String)
	key!: string;

	@Field(() => GraphQLJSON)
	meta(@Root() Submission: Submission) {
		return {
			awsBucket: 'graphweaver-test',
			awsRegion: 'ap-southeast-2',
			awsKey: Submission.key,
		};
	}

	@Field(() => String, { nullable: true })
	downloadUrl(@Root() submission: Submission) {
		if (!submission.meta(submission).awsBucket) throw new Error('Missing required AWS Bucket');
		if (!submission.meta(submission).awsRegion) throw new Error('Missing required AWS Region');

		const s3 = new S3StorageProvider({
			bucketName: submission.meta(submission).awsBucket,
			region: submission.meta(submission).awsRegion,
			type: StorageType.S3,
			expiresIn: 3600,
		});

		return s3.getDownloadUrl(submission.key);
	}
}
