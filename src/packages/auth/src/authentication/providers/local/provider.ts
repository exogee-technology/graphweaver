import { AuthToken, BaseAuthProvider, UserProfile } from '../../base-auth-provider';

export class LocalAuthProvider implements BaseAuthProvider {
	async login(email: string, password: string) {
		const user: UserProfile = {
			id: '4',
		};
		return user;
	}
	async generateAuthToken(user: UserProfile) {
		const token: AuthToken = {
			authToken: '',
			refreshToken: '',
			idToken: '',
		};
		return token;
	}
	async refreshAuthToken(refreshToken: string) {
		const token: AuthToken = {
			authToken: '',
			refreshToken: '',
			idToken: '',
		};
		return token;
	}
	async verifyAuthToken(authToken: string) {
		return true;
	}
}
