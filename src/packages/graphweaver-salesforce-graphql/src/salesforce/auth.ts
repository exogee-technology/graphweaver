import { fetch, type RequestInit } from 'undici';
import { authUrl } from './api';
import { logger } from '@traffyk-ai/data-collector-logger';
import { getSetting, setSetting } from '@traffyk-ai/data-collector-settings';
import { PORT } from '../../web-server';
/**
 * Step 1: Grant consent
 * Example:
 * curl https://atlassian.example.com/rest/oauth2/latest/authorize?
 * client_id=CLIENT_ID&
 * redirect_uri=REDIRECT_URI&
 * response_type=code&
 * state=STATE&
 * scope=SCOPE&
 * code_challenge=CODE_CHALLENGE&
 * code_challenge_method=S256
 */
/**
 * Step 2: Use the code to get an access token
 * @param code
 * Example:
 * curl -X POST https://atlassian.example.com/rest/oauth2/latest/token?
 * client_id=CLIENT_ID&
 * client_secret=CLIENT_SECRET&
 * code=CODE&
 * grant_type=authorization_code&
 * redirect_uri=REDIRECT_URI
 */
interface AccessTokenRequest {
    client_id: string;
    client_secret: string;
    grant_type: 'authorization_code' | 'refresh_token';
    code?: string;
    redirect_uri?: string;
    refresh_token?: string;
}
interface AccessTokenResponse {
    access_token: string;
    refresh_token?: string;
    expires_in: string;
    scope: string;
}
interface ErrorResponse {
    error: string;
    error_description: string;
}
type GetAccessTokenResponse = AccessTokenResponse | ErrorResponse;
let accessToken: string | undefined = undefined;
let refreshToken: string | undefined = undefined;
const getCodeRequestPayload = (clientId: string, secret: string, code?: string) => {
    logger.trace('Enter: getCodeRequestPayload');
    return {
        redirect_uri: http://localhost:${PORT}/atlassian-auth,
        grant_type: 'authorization_code',
        client_id: clientId,
        client_secret: secret,
        code,
    } as AccessTokenRequest;
};
const getRefreshRequestPayload = (clientId: string, secret: string, refreshToken: string) => {
    logger.trace('Enter: getRefreshRequestPayload');
    return {
        grant_type: 'refresh_token',
        client_id: clientId,
        client_secret: secret,
        refresh_token: refreshToken,
    } as AccessTokenRequest;
};
export const getAccessToken = async (code?: string) => {
    logger.trace('Enter: getAccessToken');
    if (accessToken) {
        logger.trace('Using cached access token');
        return accessToken;
    }
    const clientId = await getSetting<string>('atlassian.clientId');
    const secret = await getSetting<string>('atlassian.secret');
    if (!clientId || !secret) throw Error('Client ID and secret must be configured');
    refreshToken = await getSetting<string>('atlassian.refreshToken');
    if (!refreshToken && !code) throw Error('No refresh token available; please grant consent again');
    const url = new URL('token', authUrl ?? 'https://auth.atlassian.com/oauth');
    logger.trace(Requesting an access token from ${url});
    const parameters = refreshToken
        ? getRefreshRequestPayload(clientId, secret, refreshToken)
        : getCodeRequestPayload(clientId, secret, code);
    logger.trace(`Access token request parameters: `, parameters);
    const body = JSON.stringify(parameters);
    const options: RequestInit = {
        headers: {
            'Content-Type': 'application/json',
            'Content-Length': body.length.toString(),
        },
        method: 'POST',
        body,
    };
    const response = await fetch(url, options);
    const json = await response.json();
    logger.trace('Access token response: ', json);
    const reply = json as GetAccessTokenResponse;
    if ('access_token' in reply) accessToken = reply.access_token;
    if ('refresh_token' in reply) {
        refreshToken = reply.refresh_token;
        await setSetting('atlassian.refreshToken', reply.refresh_token);
    }
    return accessToken;
};