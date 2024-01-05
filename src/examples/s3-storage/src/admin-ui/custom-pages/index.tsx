import React, { useEffect } from 'react';
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

const GetSignedURLComponent = () => {
	console.log('Hey there');
	const [func, { data }] = useMutation(generateUploadUrlMutation);

	useEffect(() => {
		// Call the mutation with the "testKey" variable
		func({ variables: { key: 'testKey' } });
	}, [func]);

	// Access the mutation result through the `data` object
	console.log(data);

	return <div>nice component</div>;
};

export default GetSignedURLComponent;
