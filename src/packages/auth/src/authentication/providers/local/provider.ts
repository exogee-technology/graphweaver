import { BaseAuthProvider } from '../../base-auth-provider';
import { AuthToken } from '../../schema/token';
import { UserProfile } from '../../user-profile';

export class LocalAuthProvider implements BaseAuthProvider {
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
