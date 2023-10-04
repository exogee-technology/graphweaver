import {
	PasskeyAuthResolver as AuthResolver,
	PasskeyAuthenticatorDevice,
} from '@exogee/graphweaver-auth';
import { Resolver } from '@exogee/graphweaver';
import { ConnectionManager, DatabaseImplementation, wrap } from '@exogee/graphweaver-mikroorm';

import { myConnection } from '../../../database';

@Resolver()
export class PasskeyAuthResolver extends AuthResolver {
	private database: DatabaseImplementation;
	constructor() {
		super();
		this.database = ConnectionManager.database(myConnection.connectionManagerId);
	}

	public async getUserCurrentChallenge(userId: string): Promise<string> {}

	public async setUserCurrentChallenge(userId: string, challenge: string): Promise<boolean> {}

	public async getUserAuthenticators(userId: string): Promise<PasskeyAuthenticatorDevice[]> {}

	public async getUserAuthenticator(
		userId: string,
		authenticatorId: string
	): Promise<PasskeyAuthenticatorDevice> {}

	public async saveNewUserAuthenticator(
		userId: string,
		authenticator: PasskeyAuthenticatorDevice
	): Promise<boolean> {}

	public async saveUpdatedAuthenticatorCounter(
		authenticator: PasskeyAuthenticatorDevice,
		counter: number
	): Promise<boolean> {}
}
