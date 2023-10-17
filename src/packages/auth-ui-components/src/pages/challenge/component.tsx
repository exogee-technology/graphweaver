import { useSearchParams } from 'react-router-dom';
import {
	MagicLinkChallenge,
	OTPChallenge,
	PasskeyChallenge,
	PasswordChallenge,
	Web3Challenge,
} from '../../components';
import { AuthenticationMethod } from '../../types';

export const Challenge = () => {
	const [searchParams] = useSearchParams();

	const providers = searchParams.get('providers') ?? '';
	const [firstProvider] = providers.split(',');
	if (!firstProvider) throw new Error('Missing a provider');

	if (firstProvider === AuthenticationMethod.PASSWORD) return <PasswordChallenge />;
	if (firstProvider === AuthenticationMethod.MAGIC_LINK) return <MagicLinkChallenge />;
	if (firstProvider === AuthenticationMethod.ONE_TIME_PASSWORD) return <OTPChallenge />;
	if (firstProvider === AuthenticationMethod.WEB3) return <Web3Challenge />;
	if (firstProvider === AuthenticationMethod.PASSKEY) return <PasskeyChallenge />;
	return null;
};
