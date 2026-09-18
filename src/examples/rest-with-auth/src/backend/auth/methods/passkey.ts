import { Passkey, PasskeyData } from '@exogee/graphweaver-auth';
import { authenticationProviderFor } from '../storage';

export const passkey = new Passkey({
	dataProvider: authenticationProviderFor<PasskeyData>(),
});
