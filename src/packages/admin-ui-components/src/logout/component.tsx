import { apolloClient } from '../apollo';
import { Button } from '../button';
import { localStorageAuthKey } from '../config';

import { ReactComponent as LogoutIcon } from '../assets/16-logout.svg';

import styles from './styles.module.css';

export const Logout = () => {
	const handleOnLogout = () => {
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
