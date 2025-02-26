import { randomUUID } from 'crypto';
import fs from 'fs';
import gql from 'graphql-tag';
import { Jimp } from 'jimp';
import path from 'path';
import request from 'supertest-graphql';
import { config } from '../../../../config';

type Media = {
	filename: string;
	type: string;
	url: string;
};

type Submission = {
	id: string;
	image: Media;
};

describe('Nested entities in custom operations', () => {
	let testSubmission: Submission;

	beforeEach(async () => {
		const uuid = randomUUID();
		const filename = `${uuid}.png`;
		const newUpload = await request<{ getUploadUrl: { url: string; filename: string } }>(
			config.baseUrl
		).path('/').query(gql`
			mutation {
				getUploadUrl( key: "${filename}" ) 
			}
		`);
		const file = fs.readFileSync(path.join(__dirname, '../fixtures/pickle.png'));
		const uploadUrl = newUpload.data?.getUploadUrl.url;
		const uploadedFilename = newUpload.data?.getUploadUrl.filename;
		if (!uploadUrl) {
			throw new Error('No URL returned');
		}
		if (!uploadedFilename) {
			throw new Error('No filename returned');
		}
		await fetch(uploadUrl, {
			method: 'PUT',
			body: file,
		});

		const newSubmission = await request<{ createSubmission: Submission }>(config.baseUrl).path('/')
			.query(gql`
			mutation {
				createSubmission(input: { image: { filename: "${uploadedFilename}", type: IMAGE } }) {
					id
					image {
						filename
						type
					}
				}
			}
		`);

		if (!newSubmission.data?.createSubmission) {
			throw new Error('No submission was created or returned in setup');
		}

		testSubmission = newSubmission.data?.createSubmission;
	});

	describe('Custom queries', () => {
		test.only('should allow a selection of nested entities in a custom query', async () => {
			const response = await request<{ submissionByFilename: Submission }>(config.baseUrl).path('/')
				.query(gql`
				query {
					submissionByFilename(filename: "${testSubmission.image.filename}") {
						id
						image {
							filename
							type
							url
						}
					}
				}
			`);
			expect(response.errors).toBeUndefined();
			expect(response.data).toEqual({
				submissionByFilename: expect.objectContaining({ id: expect.any(String) }),
			});
		});
	});

	describe('Custom mutations', () => {
		test('should allow a selection of nested entities in custom mutations', async () => {
			const newSubmissionId = testSubmission.id;

			const response = await request<{ createThumbnail: Submission }>(config.baseUrl).path('/')
				.query(gql`
				mutation {
					createThumbnail(input: { submissionId: "${newSubmissionId}", width: 100, height: 100 }) {
						id
						image {
							filename
							type
							url
						}
					}
				}
			`);
			expect(response.errors).toBeUndefined();
			expect(response.data).toEqual({
				createThumbnail: expect.objectContaining({ id: expect.any(String) }),
			});

			const finalUrl = response?.data?.createThumbnail.image.url;

			if (!finalUrl) {
				throw new Error('No URL returned');
			}

			const thumbnail = await Jimp.read(finalUrl);

			expect(thumbnail.width).toEqual(100);
			expect(thumbnail.height).toEqual(100);
		});
	});
});
