import { ApolloLink, Observable } from '@apollo/client';
import { jwtDecode } from 'jwt-decode';
import { localStorageAuthKey, localStorageRefreshTokenKey } from './config';

// Refresh tokens before they expire (default: 15 minutes)
// Can be configured via VITE_AUTH_TOKEN_REFRESH_THRESHOLD_SECONDS
const REFRESH_THRESHOLD_SECONDS = import.meta.env.VITE_AUTH_TOKEN_REFRESH_THRESHOLD_SECONDS
	? parseInt(import.meta.env.VITE_AUTH_TOKEN_REFRESH_THRESHOLD_SECONDS, 10)
	: 900;

interface OAuthProviderConfig {
	provider: string;
	tokenEndpoint: string;
	clientId: string;
}

/**
 * Detects which OAuth provider is configured based on environment variables.
 * Throws an error if multiple providers are configured.
 */
const getOAuthProviderConfig = (): OAuthProviderConfig | null => {
	const configs: OAuthProviderConfig[] = [];

	// Microsoft Entra
	if (import.meta.env.VITE_MICROSOFT_ENTRA_CLIENT_ID) {
		const tenantId = import.meta.env.VITE_MICROSOFT_ENTRA_TENANT_ID || 'common';
		configs.push({
			provider: 'microsoft-entra',
			tokenEndpoint: `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`,
			clientId: import.meta.env.VITE_MICROSOFT_ENTRA_CLIENT_ID,
		});
	}

	// Auth0
	if (import.meta.env.VITE_AUTH_ZERO_DOMAIN) {
		configs.push({
			provider: 'auth0',
			tokenEndpoint: `https://${import.meta.env.VITE_AUTH_ZERO_DOMAIN}/oauth/token`,
			clientId: import.meta.env.VITE_AUTH_CLIENT_ID,
		});
	}

	// Okta
	if (import.meta.env.VITE_OKTA_DOMAIN) {
		const issuer =
			import.meta.env.VITE_OKTA_ISSUER || `https://${import.meta.env.VITE_OKTA_DOMAIN}`;
		configs.push({
			provider: 'okta',
			tokenEndpoint: `${issuer}/v1/token`,
			clientId: import.meta.env.VITE_OKTA_CLIENT_ID,
		});
	}

	if (configs.length > 1) {
		throw new Error(
			`Multiple OAuth providers configured (${configs.map((c) => c.provider).join(', ')}). Only one is supported for token refresh.`
		);
	}

	return configs[0] ?? null;
};

interface JwtPayload {
	exp?: number;
	[key: string]: unknown;
}

/**
 * Decodes a JWT and returns the payload.
 * Does not verify the signature - just extracts the payload.
 */
const decodeJwt = (token: string): JwtPayload | null => {
	try {
		// Handle "Bearer " prefix if present
		const tokenValue = token.startsWith('Bearer ') ? token.slice(7) : token;
		return jwtDecode<JwtPayload>(tokenValue);
	} catch {
		return null;
	}
};

/**
 * Checks if the token is expiring within the threshold.
 */
const isTokenExpiringSoon = (token: string): boolean => {
	const payload = decodeJwt(token);
	if (!payload?.exp) {
		// If we can't decode or there's no exp, assume it needs refresh
		return true;
	}

	const now = Math.floor(Date.now() / 1000);
	return payload.exp - now < REFRESH_THRESHOLD_SECONDS;
};

/**
 * Refreshes the access token using the refresh token.
 */
const refreshAccessToken = async (
	config: OAuthProviderConfig,
	refreshToken: string
): Promise<{ accessToken: string; refreshToken: string } | null> => {
	try {
		const body = new URLSearchParams({
			grant_type: 'refresh_token',
			client_id: config.clientId,
			refresh_token: refreshToken,
		});

		const response = await fetch(config.tokenEndpoint, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/x-www-form-urlencoded',
			},
			body: body.toString(),
		});

		if (!response.ok) {
			console.warn('Token refresh failed:', response.status, response.statusText);
			return null;
		}

		const data = await response.json();

		return {
			accessToken: data.access_token,
			// Use new refresh token if provided, otherwise keep the old one
			refreshToken: data.refresh_token ?? refreshToken,
		};
	} catch (error) {
		console.warn('Token refresh error:', error);
		return null;
	}
};

// Track in-flight refresh to prevent multiple simultaneous refreshes
let refreshPromise: Promise<boolean> | null = null;

/**
 * Attempts to refresh the token if needed.
 * Returns true if refresh was successful or not needed, false if refresh failed.
 */
const ensureFreshToken = async (): Promise<boolean> => {
	const config = getOAuthProviderConfig();
	if (!config) {
		// No OAuth provider configured, nothing to refresh
		return true;
	}

	const currentToken = localStorage.getItem(localStorageAuthKey);
	const refreshToken = localStorage.getItem(localStorageRefreshTokenKey);

	if (!currentToken || !refreshToken) {
		// No tokens to refresh
		return true;
	}

	if (!isTokenExpiringSoon(currentToken)) {
		// Token is still valid
		return true;
	}

	// Prevent multiple simultaneous refresh attempts
	if (refreshPromise) {
		return refreshPromise;
	}

	refreshPromise = (async () => {
		try {
			const result = await refreshAccessToken(config, refreshToken);

			if (result) {
				// Update stored tokens
				// Preserve the "Bearer " prefix if the original token had it
				const prefix = currentToken.startsWith('Bearer ') ? 'Bearer ' : '';
				localStorage.setItem(localStorageAuthKey, `${prefix}${result.accessToken}`);
				localStorage.setItem(localStorageRefreshTokenKey, result.refreshToken);
				return true;
			} else {
				// Refresh failed - clear tokens so user gets redirected to login
				localStorage.removeItem(localStorageAuthKey);
				localStorage.removeItem(localStorageRefreshTokenKey);
				return false;
			}
		} finally {
			refreshPromise = null;
		}
	})();

	return refreshPromise;
};

/**
 * Apollo Link that refreshes OAuth tokens before each request.
 *
 * This link:
 * 1. Detects the OAuth provider from environment variables
 * 2. Checks if the current access token is expiring soon
 * 3. If so, uses the refresh token to get a new access token
 * 4. Updates localStorage with the new tokens
 * 5. Continues with the request using the fresh token
 */
export const tokenRefreshLink = new ApolloLink((operation, forward) => {
	// Create an Observable that first refreshes the token, then forwards
	return new Observable((observer) => {
		let subscription: ReturnType<typeof forward> extends { subscribe: (arg: any) => infer R }
			? R
			: never;

		ensureFreshToken()
			.then(() => {
				subscription = forward(operation).subscribe({
					next: (value) => observer.next(value),
					error: (err) => observer.error(err),
					complete: () => observer.complete(),
				});
			})
			.catch((error) => {
				observer.error(error);
			});

		return () => {
			if (subscription) {
				subscription.unsubscribe();
			}
		};
	});
});
