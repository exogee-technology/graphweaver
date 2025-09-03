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
			body: new Uint8Array(file),
		});

		const newSubmission = await request<{ createSubmission: Submission }>(config.baseUrl)
			.path('/')
			.query(gql`
				mutation CreateSubmission($input: SubmissionInsertInput!) {
					createSubmission(input: $input) {
						id
						image {
							filename
							type
						}
					}
				}
			`)
			.variables({
				input: {
					image: {
						filename: uploadedFilename,
						type: 'IMAGE',
					},
				},
			})
			.expectNoErrors();

		if (!newSubmission.data?.createSubmission) {
			throw new Error('No submission was created or returned in setup');
		}

		testSubmission = newSubmission.data?.createSubmission;
	});

	describe('Custom queries', () => {
		test('should allow a selection of nested entities in a custom query', async () => {
			const response = await request<{ submissionByFilename: Submission }>(config.baseUrl)
				.path('/')
				.query(gql`
					query SubmissionByFilename($filename: String!) {
						submissionByFilename(filename: $filename) {
							id
							image {
								filename
								type
								url
							}
						}
					}
				`)
				.variables({
					filename: testSubmission.image.filename,
				})
				.expectNoErrors();
			expect(response.errors).toBeUndefined();
			expect(response.data).toEqual({
				submissionByFilename: expect.objectContaining({ id: expect.any(String) }),
			});
		});

		test('should allow a null result from a custom query', async () => {
			const response = await request<{ submissionByFilename: Submission }>(config.baseUrl)
				.path('/')
				.query(gql`
					query SubmissionByFilename($filename: String!) {
						submissionByFilename(filename: $filename) {
							id
							image {
								filename
								type
								url
							}
						}
					}
				`)
				.variables({
					filename: 'notexists.png',
				})
				.expectNoErrors();
			expect(response.errors).toBeUndefined();
			expect(response.data).toEqual({
				submissionByFilename: null,
			});
		});
	});

	describe('Custom mutations', () => {
		test('should allow a selection of nested entities in custom mutations', async () => {
			const newSubmissionId = testSubmission.id;

			const response = await request<{ createThumbnail: Submission }>(config.baseUrl)
				.path('/')
				.query(gql`
					mutation CreateThumbnail($input: CreateThumbnailInput!) {
						createThumbnail(input: $input) {
							id
							image {
								filename
								type
								url
							}
						}
					}
				`)
				.variables({
					input: {
						submissionId: newSubmissionId,
						width: 100,
						height: 100,
					},
				})
				.expectNoErrors();
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
