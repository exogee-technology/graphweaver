import { Button, apolloClient, localStorageAuthKey } from '@exogee/graphweaver-admin-ui-components';
import { LogoutIcon } from '../../assets/16-logout';

import styles from './styles.module.css';

type LogoutProps = {
	onLogout?: () => void;
};

export const Logout = ({ onLogout }: LogoutProps) => {
	const handleOnLogout = () => {
		onLogout?.();
		localStorage.removeItem(localStorageAuthKey);
		apolloClient.clearStore().then(() => {
			apolloClient.resetStore();
		});
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
