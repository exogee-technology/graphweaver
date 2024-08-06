import { AuthenticationMethod } from './types';

class AuthManager {
	private methods: AuthenticationMethod[] = [];

	registerMethod(method: AuthenticationMethod) {
		this.methods.push(method);
	}

	getMethods(): AuthenticationMethod[] {
		return this.methods;
	}
}

export const authManager = new AuthManager();
