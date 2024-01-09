import { UserResolver } from './user';
import { SubmissionResolver } from './submission';
import { S3StorageResolver } from '@exogee/graphweaver-storage-provider';
import { Resolver } from '@exogee/graphweaver';

@Resolver()
class MyS3StorageResolver extends S3StorageResolver {
	constructor() {
		super({
			bucketName: 'graphweaver-test',
			region: process.env.AWS_REGION,
			type: 's3',
		});
	}
}

export const resolvers = [UserResolver, SubmissionResolver, MyS3StorageResolver];
