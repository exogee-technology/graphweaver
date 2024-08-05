import { Passkey, PasskeyData } from '@exogee/graphweaver-auth';
import { MikroBackendProvider } from '@exogee/graphweaver-mikroorm';

import { Authentication } from '../../entities/mysql';
import { myConnection } from '../../database';

export const passkey = new Passkey({
	dataProvider: new MikroBackendProvider(Authentication<PasskeyData>, myConnection),
});
