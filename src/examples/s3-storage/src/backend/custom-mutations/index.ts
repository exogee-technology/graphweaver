import {
	Field,
	fromBackendEntity,
	graphweaverMetadata,
	ID,
	InputType,
	ResolverOptions,
} from '@exogee/graphweaver';
import { ConnectionManager } from '@exogee/graphweaver-mikroorm';
import { Jimp } from 'jimp';
import { pgConnection } from '../database';
import { s3Provider } from '../s3-provider';
import { Submission } from '../schema';
@InputType('CreateThumbnailInput')
class CreateThumbnailInput {
	@Field(() => ID)
	submissionId: number;

	@Field(() => Number)
	width: number;

	@Field(() => Number)
	height: number;
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
		const database = ConnectionManager.database(pgConnection.connectionManagerId);
		const submission = await database.em.findOneOrFail(Submission, {
			id: args.input.submissionId.toString(),
		});

		const filename = submission.image.filename;

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
		const result = await database.em.create(Submission, {
			image: {
				filename: upload.filename,
				type: upload.type,
				url: upload.url,
			},
		});

		await database.em.persistAndFlush(result);

		// Call fromBackendEntity to ensure the client can access nested fields
		return fromBackendEntity(Submission, result);
	},
});
