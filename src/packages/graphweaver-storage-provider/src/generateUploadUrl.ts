import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { Arg, createBaseResolver, ID, Mutation, Resolver } from '@exogee/graphweaver';

// This entity will have to be defined in the project that uses this package.
// import { SubmissionDataEntity } from './data-entity';
// import { Submission } from './entity';
// import { SubmissionProvider } from './provider';

// @Resolver(() => Submission)
export class UploadResolver {
	@Mutation(() => String)
	async generateUploadUrl(@Arg('key', () => ID) key: string): Promise<string> {
		if (!process.env.AWS_S3_BUCKET) throw new Error('Missing required env AWS_S3_BUCKET');

		const endpoint = process.env.AWS_S3_ENDPOINT;

		const s3 = new S3Client({
			region: process.env.AWS_DEFAULT_REGION ?? 'ap-southeast-2',
			...(endpoint ? { endpoint } : {}),
		});

		const command = new PutObjectCommand({
			Bucket: process.env.AWS_S3_BUCKET,
			Key: key,
		});

		const url = await getSignedUrl(s3, command, { expiresIn: 60 * 60 });
		return url;
	}
}
