import {
	Button,
	apolloClient,
	localStorageAuthKey,
	toast,
} from '@exogee/graphweaver-admin-ui-components';
import { LogoutIcon } from '../../assets/16-logout';

import styles from './styles.module.css';
import { useNavigate } from 'react-router-dom';

type LogoutProps = {
	onLogout?: () => Promise<void>;
};

export const Logout = ({ onLogout }: LogoutProps) => {
	const navigate = useNavigate();

	const handleOnLogout = async () => {
		try {
			localStorage.removeItem(localStorageAuthKey);
			await apolloClient.clearStore();
			if (onLogout) {
				await onLogout();
			} else {
				navigate(0);
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
