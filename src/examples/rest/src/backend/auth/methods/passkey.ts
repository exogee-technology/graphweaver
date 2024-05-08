import { Passkey, PasskeyAuthenticator, PasskeyChallenge } from '@exogee/graphweaver-auth';
import { MikroBackendProvider } from '@exogee/graphweaver-mikroorm';

import { Authentication } from '../../entities/mysql';
import { myConnection } from '../../database';

export const passkey = new Passkey({
	passkeyChallengeProvider: new MikroBackendProvider(
		Authentication<PasskeyChallenge>,
		myConnection
	),
	passkeyAuthenticatorProvider: new MikroBackendProvider(
		Authentication<PasskeyAuthenticator>,
		myConnection
	),
});
