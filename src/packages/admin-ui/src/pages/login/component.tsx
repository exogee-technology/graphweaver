import { Login as LoginForm } from '@exogee/graphweaver-admin-ui-components';

import styles from './styles.module.css';

export const Login = () => {
	return (
		<div className={styles.wrapper}>
			<div className={styles.container}>
				<LoginForm />
			</div>
		</div>
	);
};
