import { OktaAuth } from '@okta/okta-auth-js';

const clientId = import.meta.env.VITE_OKTA_CLIENT_ID || '';
const oktaDomain = import.meta.env.VITE_OKTA_DOMAIN || '';
const issuer = import.meta.env.VITE_OKTA_ISSUER || `https://${oktaDomain}`;

export const okta = !oktaDomain
	? null
	: new OktaAuth({
			issuer,
			clientId,
			pkce: true,
		});
