import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { Arg, ID, Mutation, Resolver } from '@exogee/graphweaver';

//storage resolver
export class UploadResolver {
	//Shunk this out
	@Mutation(() => String)
	async generateUploadUrl(@Arg('key', () => ID) key: string): Promise<string> {
		if (!process.env.AWS_S3_BUCKET) throw new Error('Missing required env AWS_S3_BUCKET');

		const s3 = new S3Client({
			region: process.env.AWS_DEFAULT_REGION,
		});

		const command = new PutObjectCommand({
			Bucket: process.env.AWS_S3_BUCKET,
			Key: key,
		});

		const url = await getSignedUrl(s3, command, { expiresIn: 60 * 60 });
		return url;
	}
}
