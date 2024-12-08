import { OktaAuth } from '@okta/okta-auth-js';

const clientId = import.meta.env.VITE_OKTA_CLIENT_ID || '';
const oktaDomain = import.meta.env.VITE_OKTA_DOMAIN || `${clientId}.okta.com`;
const issuer = import.meta.env.VITE_OKTA_ISSUER || `https://${oktaDomain}/oauth2/default`;

export const okta = new OktaAuth({
	issuer,
	clientId,
	pkce: true,
});
