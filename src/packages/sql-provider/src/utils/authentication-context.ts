import { logger } from '@nscc-easy/logger';

class AuthenticationContextImplementation {
	private currentUserLogin?: string;

	public clear() {
		this.currentUserLogin = undefined;
	}

	public set(user: string) {
		logger.trace(`Setting AuthenticationContext.currentUser to ${user}`);
		this.currentUserLogin = user;
	}

	public get currentUser() {
		if (!this.currentUserLogin)
			throw new Error('Attempted to access AuthenticationContext before it has been set');
		return this.currentUserLogin;
	}
}
export const AuthenticationContext = new AuthenticationContextImplementation();
