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

			// We do NOT want to call apolloClient.resetStore() here.
			// This refetches all active queries, which causes calls to the backend, which causes the user to be redirected
			// back to the login page while being half logged out. The onLogout function MUST be called before calling apolloClient.resetStore()
			// so Okta and the like can be logged out before the queries are refetched.
			await apolloClient.clearStore();

			if (onLogout) {
				await onLogout();
			} else {
				setLocation('/');
			}

			// In many cases the code down here won't even run, but if we did make it down here, then now's the time to tell Apollo to fully clear
			// the store and refetch all active queries.
			await apolloClient.resetStore();
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
