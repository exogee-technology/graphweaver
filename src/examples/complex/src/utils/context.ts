import { AuthenticationError } from '@exogee/graphweaver-apollo';
import { logger } from '@exogee/logger';

import { EasyAuthorizationContext } from '../auth';

export const handleContext = async ({ express }): Promise<EasyAuthorizationContext> => {
	const authorization = express.req?.headers?.authorization;

	if (!authorization) {
		throw new AuthenticationError('Invalid Authentication.');
	}

	const authPrefix = authorization.substring(0, 7).toLowerCase();
	if (authPrefix !== 'bearer ') {
		throw new AuthenticationError(
			"Authorization header is expected to be in the format 'Bearer <your_JWT_token>'."
		);
	}
	const token = authorization.substring(7);
	const userAgent = express.req?.headers?.['user-agent'];

	// Check token, throw error if does not exist / is expired
	try {
		return {
			session: {
				token,
				expiry: 100000,
			},
		};
	} catch (err: any) {
		logger.error(`Authorization error: ${err}`);
		throw new AuthenticationError('Unauthorized');
	}
};
