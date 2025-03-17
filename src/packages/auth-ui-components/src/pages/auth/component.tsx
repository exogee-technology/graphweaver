import { Spacer } from '@exogee/graphweaver-admin-ui-components';

import styles from './styles.module.css';

export const Auth = ({ children }: { children: React.ReactNode }) => {
	return (
		<div className={styles.wrapper}>
			<div className={styles.container}>{children}</div>
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
