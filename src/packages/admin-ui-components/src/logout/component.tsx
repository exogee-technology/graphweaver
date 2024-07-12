import { useEffect } from 'react';

import { apolloClient } from '../apollo';
import { Button } from '../button';
import { localStorageAuthKey } from '../config';

import { LogoutIcon } from '../assets/16-logout';

import styles from './styles.module.css';

export const Logout = () => {
	useEffect(() => {
		console.warn(
			'Logout component from AdminUI components is deprecated and will be removed in a future version. Use Logout from the AuthUI components instead.'
		);
	}, []);

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
