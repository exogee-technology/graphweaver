import { BaseAuthTokenProvider } from '../../base-auth-token-provider';
import { AuthToken } from '../../schema/token';
import { UserProfile } from '../../user-profile';

export class LocalAuthTokenProvider implements BaseAuthTokenProvider {
	async generateToken(user: UserProfile) {
		const token = new AuthToken('', '');
		return token;
	}
	async refreshToken(refreshToken: string) {
		const token = new AuthToken('', '');
		return token;
	}
	async verifyToken(authToken: string) {
		return false;
	}
}
