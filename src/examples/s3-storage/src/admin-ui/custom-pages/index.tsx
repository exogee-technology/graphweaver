import React, { useEffect, useState } from 'react';
import { gql, useMutation } from '@apollo/client';

export const customPages = {
	routes: () => [
		{
			path: '/test',
			element: <GetSignedURLComponent />,
		},
	],
};

const generateUploadUrlMutation = gql`
	mutation GenerateUploadUrl($key: ID!) {
		generateUploadUrl(key: $key)
	}
`;

const createSubmissionMutation = gql`
	mutation Mutation($createSubmissionData: SubmissionInsertInput!) {
		createSubmission(data: $createSubmissionData) {
			id
			url
		}
	}
`;

const GetSignedURLComponent = () => {
	const [getPresignedURL, { data }] = useMutation(generateUploadUrlMutation);
	const [createSubmission] = useMutation(createSubmissionMutation);

	const handleFileUpload = async (file: any) => {
		const res = await getPresignedURL({ variables: { key: file.name } });
		console.log(res);

		const uploadURL = res.data.generateUploadUrl;

		if (!uploadURL) {
			console.error('Upload URL is not available');
			return;
		}

		try {
			const response = await fetch(uploadURL, {
				method: 'PUT',
				body: file,
				headers: {
					// This file.type isn't getting uploaded to S3
					'Content-Type': file.type,
				},
			});
			console.log(response);
			if (response.ok) {
				console.log('File uploaded successfully!');
				// Now we can save the url to a new submission entity
				const submission = await createSubmission({
					variables: {
						createSubmissionData: {
							url: uploadURL,
						},
					},
				});

				console.log(submission);
			} else {
				console.error('Error uploading file:', response.statusText);
			}
		} catch (error) {
			console.error('Error:', error);
		}
	};

	const handleFileInputChange = (event: React.ChangeEventHandler<HTMLInputElement>) => {
		const file = event.target.files[0];
		if (file) {
			handleFileUpload(file);
		}
	};

	return (
		<div>
			<div>nice component</div>
			<input type="file" onChange={handleFileInputChange} />
		</div>
	);
};

export default GetSignedURLComponent;
