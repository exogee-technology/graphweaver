import { useSearchParams } from 'react-router-dom';
import { MagicLinkChallenge, PasswordChallenge } from '../../components';

export enum AuthenticationMethod {
	PASSWORD = 'pwd',
	MAGIC_LINK = 'mgl',
}

export const Challenge = () => {
	const [searchParams] = useSearchParams();

	const providers = searchParams.get('providers') ?? '';
	const [firstProvider] = providers.split(',');
	if (!firstProvider) throw new Error('Missing a provider');

	if (firstProvider === AuthenticationMethod.PASSWORD) return <PasswordChallenge />;
	if (firstProvider === AuthenticationMethod.MAGIC_LINK) return <MagicLinkChallenge />;
	return null;
};
