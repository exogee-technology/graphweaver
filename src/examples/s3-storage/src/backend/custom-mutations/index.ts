import {
	Field,
	fromBackendEntity,
	graphweaverMetadata,
	ID,
	InputType,
	ResolverOptions,
} from '@exogee/graphweaver';
import { Jimp } from 'jimp';
import { s3Provider } from '../s3-provider';
import { Submission, submissionProvider } from '../schema/submission';
@InputType('CreateThumbnailInput')
class CreateThumbnailInput {
	@Field(() => ID)
	submissionId!: number;

	@Field(() => Number)
	width!: number;

	@Field(() => Number)
	height!: number;
}

graphweaverMetadata.addMutation({
	name: 'createThumbnail',
	getType: () => Submission,
	args: { input: () => CreateThumbnailInput },
	resolver: async ({
		args,
		context,
		source,
		info,
		fields,
	}: ResolverOptions<{ input: CreateThumbnailInput }>) => {
		// get the metadata of the submission to copy
		const submission = await submissionProvider.findOne({
			id: args.input.submissionId.toString(),
		});

		if (!submission) throw new Error('Submission not found');

		const filename = submission.image?.filename;

		if (!filename) {
			throw new Error('No filename attached to submission');
		}

		// fetch the image data
		const imageUrl = await s3Provider.getDownloadUrlForKey(filename);

		// resize the image to the desired dimensions
		const input = await Jimp.read(imageUrl);
		const resizedImage = await input
			.resize({ w: args.input.width, h: args.input.height })
			.getBuffer('image/png');

		const upload = await s3Provider.getUploadUrl({
			args: { key: filename },
			source,
			context,
			info,
			fields,
		});

		// upload the image to s3
		await fetch(upload.url, {
			method: 'PUT',
			body: new Uint8Array(resizedImage),
		});

		// create the new submission in the database
		const result = await submissionProvider.createOne({
			image: {
				filename: upload.filename,
				type: upload.type,
				url: upload.url,
			},
		} as Partial<Submission>);

		// Call fromBackendEntity to ensure the client can access nested fields
		return fromBackendEntity(Submission, result);
	},
});
