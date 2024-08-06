import { AuthenticationMethod } from '../../types';
import { BaseAuthMethod } from './base-auth-method';

export class AuthZero extends BaseAuthMethod {
	constructor() {
		super(AuthenticationMethod.AUTH_ZERO);
	}
}
