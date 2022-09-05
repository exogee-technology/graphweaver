import jwtDecode from 'jwt-decode';
import { AuthChecker } from 'type-graphql';

import { AuthenticationError } from '../utils';
import { EasyAuthorizationContext } from '.';

export const cognitoAuthChecker: AuthChecker<EasyAuthorizationContext> = (
	{ root, args, context, info },
	roles
) => {
	throw new AuthenticationError('You must be logged in to perform this action');
};
