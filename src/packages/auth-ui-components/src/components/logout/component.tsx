import { Button, apolloClient, localStorageAuthKey } from '@exogee/graphweaver-admin-ui-components';
import { LogoutIcon } from '../../assets/16-logout';

import styles from './styles.module.css';
import { useNavigate } from 'react-router-dom';

type LogoutProps = {
	onLogout?: () => Promise<void>;
};

export const Logout = ({ onLogout }: LogoutProps) => {
	const navigate = useNavigate();

	const handleOnLogout = async () => {
		if (onLogout) await onLogout();
		localStorage.removeItem(localStorageAuthKey);
		await apolloClient.clearStore();
		await apolloClient.resetStore();
		navigate(0);
	};

	return (
		<div className={styles.buttonContainer}>
			<Button className={styles.logoutButton} onClick={handleOnLogout}>
				<LogoutIcon />
				Sign out
			</Button>
		</div>
	);
};
