import React from 'react';
import { gql, useMutation } from '@apollo/client';

export const customPages = {
	routes: () => [
		{
			path: '/test',
			element: <GetSignedURLComponent />,
		},
	],
};

const getUploadUrlMutation = gql`
	mutation GetUploadUrl($key: ID!) {
		getUploadUrl(key: $key)
	}
`;

const createSubmissionMutation = gql`
	mutation Mutation($createSubmissionData: SubmissionInsertInput!) {
		createSubmission(data: $createSubmissionData) {
			id
		}
	}
`;

const GetSignedURLComponent = () => {
	const [getUploadUrl] = useMutation(getUploadUrlMutation);
	const [createSubmission] = useMutation(createSubmissionMutation);

	const handleFileUpload = async (file: any) => {
		const res = await getUploadUrl({ variables: { key: file.name } });
		const uploadURL = res.data.getUploadUrl;
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

			if (response.ok) {
				// Save the download url to a new submission entity
				const submission = await createSubmission({
					variables: {
						createSubmissionData: {
							key: file.name,
						},
					},
				});
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
