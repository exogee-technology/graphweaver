import {
	Button,
	apolloClient,
	localStorageAuthKey,
	toast,
} from '@exogee/graphweaver-admin-ui-components';
import { LogoutIcon } from '../../assets/16-logout';

import styles from './styles.module.css';
import { useLocation } from 'wouter';

type LogoutProps = {
	onLogout?: () => Promise<void>;
};

export const Logout = ({ onLogout }: LogoutProps) => {
	const [, setLocation] = useLocation();

	const handleOnLogout = async () => {
		try {
			localStorage.removeItem(localStorageAuthKey);
			await apolloClient.resetStore();
			if (onLogout) {
				await onLogout();
			} else {
				setLocation('/');
			}
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
