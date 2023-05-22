import { GraphweaverLogo } from '../assets';
import { Button } from '../button';
import { Input } from '../input';

import styles from './styles.module.css';

export const Login = () => {
	return (
		<div className={styles.wrapper}>
			<GraphweaverLogo width="52" className={styles.logo} />
			<div className={styles.titleContainer}>Login</div>
			<Input inputMode={'text'} fieldName={'username'} />
			<Input inputMode={'text'} fieldName={'password'} />
			<div className={styles.buttonContainer}>
				<Button type="submit">Login</Button>
			</div>
		</div>
	);
};
