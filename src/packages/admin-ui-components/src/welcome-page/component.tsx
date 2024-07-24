import { PropsWithChildren } from 'react';
import { GraphweaverLogo } from '../assets';
import { StarField } from '../star-field';
import styles from './styles.module.css';
import { Link } from 'react-router-dom';

interface Props extends PropsWithChildren {
	skipPath?: string;
}

export const WelcomePage = ({ children, skipPath }: Props) => (
	<div className={styles.wrapper}>
		<div className={styles.leftPanel}>
			<div className={styles.leftPanelHeaderBar}>
				<GraphweaverLogo className={styles.logo} />
				{skipPath && (
					<Link to={skipPath} className={styles.skipLink}>
						Skip
					</Link>
				)}
			</div>

			{children}
		</div>
		<div className={styles.rightPanel}>
			<StarField />
		</div>
	</div>
);
