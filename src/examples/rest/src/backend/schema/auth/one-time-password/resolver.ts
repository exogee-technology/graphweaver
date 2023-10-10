import {
	OneTimePasswordAuthResolver as AuthResolver,
	OneTimePasswordData,
} from '@exogee/graphweaver-auth';
import { Resolver } from '@exogee/graphweaver';
import { MikroBackendProvider } from '@exogee/graphweaver-mikroorm';

import { myConnection } from '../../../database';
import { Authentication } from '../../../entities/mysql';

@Resolver()
export class OneTimePasswordAuthResolver extends AuthResolver {
	constructor() {
		super({
			provider: new MikroBackendProvider(Authentication<OneTimePasswordData>, myConnection),
		});
	}
}
