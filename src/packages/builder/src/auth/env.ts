import crypto from 'crypto';

const generateKeyPair = async () => {
	const { privateKey, publicKey } = crypto.generateKeyPairSync('ec', {
		namedCurve: 'prime256v1',
		privateKeyEncoding: {
			type: 'pkcs8',
			format: 'der',
		},
		publicKeyEncoding: {
			type: 'spki',
			format: 'der',
		},
	});

	return { privateKey: privateKey.toString('base64'), publicKey: publicKey.toString('base64') };
};

export const generateAuthEnv = async () => {
	console.log('Generating Auth Environment...');

	const { privateKey, publicKey } = await generateKeyPair();

	const env = `
# Generated Auth Environment Variables
# This file contains the environment variables required for password authentication.
AUTH_PUBLIC_KEY_PEM_BASE64='${publicKey}'
AUTH_PRIVATE_KEY_PEM_BASE64='${privateKey}'
AUTH_BASE_URI="http://localhost:9000"
AUTH_WHITELIST_DOMAINS="localhost"
`;

	return env;
};
