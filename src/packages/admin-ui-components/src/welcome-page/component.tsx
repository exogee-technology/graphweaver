import { PropsWithChildren } from 'react';
import { GraphweaverLogo } from '../assets';
import { StarField } from '../star-field';
import styles from './styles.module.css';

export const WelcomePage = ({ children }: PropsWithChildren) => (
	<div className={styles.wrapper}>
		<div className={styles.leftPanel}>
			<GraphweaverLogo className={styles.logo} />
			{children}
		</div>
		<div className={styles.rightPanel}>
			<StarField />
		</div>
	</div>
);
