import { useSearchParams } from 'react-router-dom';
import { MagicLinkChallenge, PasswordChallenge } from '../../components';
import { AuthenticationMethod } from '../../types';

export const Challenge = () => {
	const [searchParams] = useSearchParams();

	const providers = searchParams.get('providers') ?? '';
	const [firstProvider] = providers.split(',');
	if (!firstProvider) throw new Error('Missing a provider');

	if (firstProvider === AuthenticationMethod.PASSWORD) return <PasswordChallenge />;
	if (firstProvider === AuthenticationMethod.MAGIC_LINK) return <MagicLinkChallenge />;
	return null;
};
