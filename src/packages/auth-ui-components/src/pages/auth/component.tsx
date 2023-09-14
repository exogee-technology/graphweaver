import { Spacer } from '@exogee/graphweaver-admin-ui-components';
import { Outlet } from 'react-router-dom';

import styles from './styles.module.css';

export const Auth = () => {
	return (
		<div className={styles.wrapper}>
			<div className={styles.container}>
				<Outlet />
			</div>
			<Spacer height={30} />

			<div className={styles.footer}>
				<div className={styles.footerText}>
					Powered by{' '}
					<a href="https://graphweaver.com/" target="_blank">
						Graphweaver
					</a>
				</div>
			</div>
		</div>
	);
};
