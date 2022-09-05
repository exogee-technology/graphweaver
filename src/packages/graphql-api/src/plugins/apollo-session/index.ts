import { PluginDefinition } from 'apollo-server-core';
import cookie from 'cookie';
import signature from 'cookie-signature';
import * as crypto from 'crypto';
import uid from 'uid-safe';

import { DatabaseStore } from './database-store';

interface ApolloSessionStore {
	get(key: string): any | Promise<any>;
	set(key: string, sessionDuration: number, value: any): void | Promise<void>;
	touch(key: string, sessionDuration: number): void | Promise<void>;
	clearExpired(sessionDuration: number): void | Promise<void>;
	delete(key: string): void | Promise<void>;
}

interface Options {
	cookieName?: string;
	store?: ApolloSessionStore;
}

// TODO: Make configurable
const cookieName = 'ast';
const store = new DatabaseStore() as ApolloSessionStore;
const sessionDuration = 60 * 60 * 4; // 4 hours
const beginningOfTime = new Date(0);
const blankCookieValue = 'none';
const httpOnly = true;
const secure = process.env.NODE_ENV === 'production';
const cookieSecret = 'some-very-long-string-here';

const hash = (input: string) => {
	const hasher = crypto.createHash('sha1');
	hasher.update(input);
	return hasher.digest('base64');
};

export const ApolloSession: PluginDefinition = {
	async requestDidStart({ request }) {
		const rawCookie = request.http?.headers.get('cookie');
		const sessionTokenWithSignature = cookie.parse(rawCookie || '')[cookieName];
		// Ensure our token was correctly signed if it was provided
		const sessionToken =
			sessionTokenWithSignature && signature.unsign(sessionTokenWithSignature, cookieSecret);
		let initialSessionHash = '';
		let userRequestedLogout = false;

		return {
			responseForOperation: async ({ context }) => {
				context.session = sessionToken ? await store.get(sessionToken) : undefined;
				if (context.session) {
					initialSessionHash = hash(JSON.stringify(context.session));
					context.logout = () => {
						userRequestedLogout = true;
					};
				}
				return null;
			},

			willSendResponse: async ({ context, response }) => {
				const logout = context?.session?.logout;
				const serialisedSession = JSON.stringify(context?.session);
				const newSessionId = sessionToken || (await uid(24));
				const cookieValue = signature.sign(newSessionId, cookieSecret);

				const setSessionCookie = () => {
					response.http?.headers.set(
						'Set-Cookie',
						cookie.serialize(cookieName, cookieValue, {
							maxAge: sessionDuration,
							httpOnly,
							secure,
						})
					);
				};

				const deleteSessionCookie = () => {
					response.http?.headers.set(
						'Set-Cookie',
						cookie.serialize(cookieName, blankCookieValue, {
							expires: beginningOfTime,
							httpOnly,
							secure,
						})
					);
				};

				if (serialisedSession && hash(serialisedSession) !== initialSessionHash && !logout) {
					// Persist either a new session or update the existing session
					await store.set(newSessionId, sessionDuration, context.session);
					setSessionCookie();
				} else if (userRequestedLogout && sessionToken) {
					// A client requested to log out of a valid session
					await store.delete(sessionToken);
					deleteSessionCookie();
					userRequestedLogout = false;
				} else if (sessionToken && serialisedSession) {
					// A client provided a valid session, but we haven't made changes, we can warm it up.
					await store.touch(sessionToken, sessionDuration);
					setSessionCookie();
				}

				await store.clearExpired(sessionDuration);
			},
		};
	},
};
