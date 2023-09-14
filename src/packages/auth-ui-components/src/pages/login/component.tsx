import { Spacer } from '@exogee/graphweaver-admin-ui-components';
import { LoginForm, LoginProps } from '../../';

import styles from './styles.module.css';

export const Login = (props: LoginProps) => {
	return (
		<div className={styles.wrapper}>
			<div className={styles.container}>
				<LoginForm {...props} />
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
