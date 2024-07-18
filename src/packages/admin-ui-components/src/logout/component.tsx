import { useEffect } from 'react';

import { apolloClient } from '../apollo';
import { Button } from '../button';
import { localStorageAuthKey } from '../config';

import { LogoutIcon } from '../assets/16-logout';

import styles from './styles.module.css';

export const Logout = () => {
	useEffect(() => {
		console.warn(
			'The Logout component from AdminUI is deprecated and will be removed in a future version. Please update your code to use the Logout component from the AuthUI package instead.'
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
