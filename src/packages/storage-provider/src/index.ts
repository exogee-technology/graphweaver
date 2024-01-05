import { fileURLToPath } from 'url';
import fs from 'fs';

// snippet-start:[s3.JavaScript.buckets.uploadV3]
import { PutObjectCommand, GetObjectCommand, S3Client } from '@aws-sdk/client-s3';

const client = new S3Client({
	region: 'ap-southeast-2',
});

export const uploadToS3 = async (buffer: Buffer, key: string): Promise<string> => {
	const bucket = process.env.AWS_S3_BUCKET;
	//const s3Endpoint = process.env.AWS_S3_ENDPOINT;
	//const cdnEndpoint = process.env.AWS_CDN_ENDPOINT;
	if (!bucket) throw new Error('Missing S3 bucket');
	if (!key) throw new Error('Missing S3 key');

	const s3 = new S3Client({});

	await s3.send(
		new PutObjectCommand({
			Bucket: bucket,
			Body: buffer,
			Key: `${key}.jpg`,
		})
	);
	return `${bucket}/${key}.jpg`;
	//return getThumbnailUrl(key);
};

export const getObjectFromS3 = async (key: string) => {
	const bucket = process.env.AWS_S3_BUCKET;
	const command = new GetObjectCommand({
		Bucket: bucket,
		Key: key,
	});

	try {
		const response = await client.send(command);
		// The Body object also has 'transformToByteArray' and 'transformToWebStream' methods.
		const str = await response.Body?.transformToString();
		console.log(str);
	} catch (err) {
		console.error(err);
	}
};

// const filePath = '/Users/taylornodell/Downloads/Monte and Rebel /20231130_174131.jpg';
// const fileContent = fs.readFileSync(filePath);
// export const main = async () => {
// 	const command = new PutObjectCommand({
// 		Bucket: 'graphweaver-test',
// 		Key: 'image.jpg',
// 		Body: fileContent,
// 	});

// 	try {
// 		const response = await client.send(command);
// 		console.log(response);
// 	} catch (err) {
// 		console.error(err);
// 	}
// };

// // Invoke main function if this file was run directly.
// // if (process.argv[1] === fileURLToPath(import.meta.url)) {
// main();
// // }
