import crypto from 'crypto';

export const generateKeyPair = async () => {
	const { privateKey, publicKey } = crypto.generateKeyPairSync('ec', {
		namedCurve: 'prime256v1',
	});

	const regex = /.{64}/g;

	// Export the private key
	const privateKeyDer = privateKey.export({ type: 'sec1', format: 'der' }).toString('base64');
	const formattedPrivateKey = privateKeyDer.replace(regex, '$&\n');
	const privatePem = `-----BEGIN EC PRIVATE KEY-----\n${formattedPrivateKey}\n-----END EC PRIVATE KEY-----\n`;
	const base64EncodedPrivatePem = Buffer.from(privatePem).toString('base64');

	// Export the public key
	const publicKeyDer = publicKey.export({ type: 'spki', format: 'der' }).toString('base64');
	const formattedPublicKey = publicKeyDer.replace(regex, '$&\n');
	const publicPem = `-----BEGIN PUBLIC KEY-----\n${formattedPublicKey}\n-----END PUBLIC KEY-----\n`;
	const base64EncodedPublicPem = Buffer.from(publicPem).toString('base64');

	return { privateKey: base64EncodedPrivatePem, publicKey: base64EncodedPublicPem };
};

export const generateAuthEnv = async (method: 'password' | 'api-key') => {
	console.log('Generating Auth Environment...');

	const { privateKey, publicKey } = await generateKeyPair();

	const keys = `AUTH_PUBLIC_KEY_PEM_BASE64='${publicKey}'
AUTH_PRIVATE_KEY_PEM_BASE64='${privateKey}'`;

	const env = `
# Generated Auth Environment Variables
# This file contains the environment variables required for authentication.
${method === 'password' ? keys : ''}
AUTH_BASE_URI="http://localhost:9000"
AUTH_WHITELIST_DOMAINS="localhost"
`;

	return env;
};
