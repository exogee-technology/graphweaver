import {
	PasskeyAuthResolver as AuthResolver,
	PasskeyAuthenticator,
	PasskeyChallenge,
} from '@exogee/graphweaver-auth';
import { Resolver } from '@exogee/graphweaver';
import { MikroBackendProvider } from '@exogee/graphweaver-mikroorm';

import { myConnection } from '../../../database';
import { Authentication } from '../../../entities';

@Resolver()
export class PasskeyAuthResolver extends AuthResolver {
	constructor() {
		super({
			passkeyChallengeProvider: new MikroBackendProvider(
				Authentication<PasskeyChallenge>,
				myConnection
			),
			passkeyAuthenticatorProvider: new MikroBackendProvider(
				Authentication<PasskeyAuthenticator>,
				myConnection
			),
		});
	}
}
