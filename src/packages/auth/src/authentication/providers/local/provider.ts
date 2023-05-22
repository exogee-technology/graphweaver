import { AuthProvider, BaseAuthProvider, UserProfile } from '../../base-auth-provider';
import { AuthToken } from '../../schema/token';

export class LocalAuthProvider implements BaseAuthProvider {
	async login(email: string, password: string) {
		const user: UserProfile = {
			id: '4',
			provider: AuthProvider.LOCAL,
			displayName: 'Darth Vader',
			email: 'darth@deathstar.com',
			roles: [],
			isReference: () => {
				return false;
			},
			isCollection: () => {
				return false;
			},
		};
		return user;
	}
	async generateAuthToken(user: UserProfile) {
		const token = new AuthToken('');
		return token;
	}
	async refreshAuthToken(refreshToken: string) {
		const token = new AuthToken('');
		return token;
	}
	async verifyAuthToken(authToken: string) {
		return true;
	}
}
