import { AuthorizationContext, ForbiddenError } from '@exogee/graphweaver-auth';

export const beforeRead = (context: AuthorizationContext) => {
	// Ensure only logged in users can access the admin ui metadata
	if (!context.token) throw new ForbiddenError('Forbidden');
};
