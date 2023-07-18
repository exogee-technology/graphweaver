import { Login as LoginForm, LoginProps } from '@exogee/graphweaver-admin-ui-components';

import styles from './styles.module.css';

export const Login = (props: LoginProps) => {
	return (
		<div className={styles.wrapper}>
			<div className={styles.container}>
				<LoginForm {...props} />
			</div>
		</div>
	);
};
