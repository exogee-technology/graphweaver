import { SubmissionResolver } from './submission';
import { S3StorageResolver, StorageType } from '@exogee/graphweaver-storage-provider';
import { Resolver } from '@exogee/graphweaver';

@Resolver()
class MyS3StorageResolver extends S3StorageResolver {
	constructor() {
		if (!process.env.AWS_S3_BUCKET) throw new Error('Missing required env AWS_S3_BUCKET');
		super({
			bucketName: process.env.AWS_S3_BUCKET,
			region: process.env.AWS_REGION,
			type: StorageType.S3,
		});
	}
}

export const resolvers = [SubmissionResolver, MyS3StorageResolver];
