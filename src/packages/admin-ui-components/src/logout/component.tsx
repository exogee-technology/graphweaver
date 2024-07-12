import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

import styles from './styles.module.css';

import { apolloClient } from '../apollo';
import { localStorageAuthKey } from '../config';
import { Button } from '../button';
import { LogoutIcon } from '../assets';
import { useEffect } from 'react';

export const Logout = () => {
	const navigate = useNavigate();

	useEffect(() => {
		console.warn(
			'Logout component from AdminUI components is deprecated and will be removed in a future version. Use Logout from the AuthUI components instead.'
		);
	}, []);

	const handleOnLogout = async () => {
		try {
			localStorage.removeItem(localStorageAuthKey);
			await apolloClient.clearStore();
			await apolloClient.resetStore();
			navigate(0);
		} catch (error: any) {
			const message = error?.message || 'Unknown error.';
			toast.error(`Failed to logout. Please try again. Error: ${message}`, {
				duration: 5000,
			});
		}
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
