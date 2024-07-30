import { UserProfile } from './user-profile';

type AddUserToContext<R> = (userId: string) => Promise<UserProfile<R>>;

class AuthContextManager<R> {
	private _addUserToContext?: AddUserToContext<R>;

	setAddUserToContext(callback: AddUserToContext<R>) {
		this._addUserToContext = callback;
	}

	get addUserToContext(): AddUserToContext<R> | undefined {
		return this._addUserToContext;
	}
}

export const authContextManager = new AuthContextManager<unknown>();

export function setAddUserToContext<R>(callback: AddUserToContext<R>) {
	authContextManager.setAddUserToContext(callback);
}

export function getAddUserToContext() {
	return authContextManager.addUserToContext;
}
