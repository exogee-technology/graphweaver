import { Link } from 'wouter';
import { Button, GraphweaverLogo, Spacer, StarField } from '..';
import { ErrorIcon } from '../assets';
import styles from './styles.module.css';

export const Page404 = () => {
	return (
		<>
			<StarField className={styles.starField} />
			<div className={styles.wrapper}>
				<div className={styles.errorBox}>
					<Spacer height={20} />

					<Link to="/" className={styles.logoWrapper}>
						<GraphweaverLogo width="52" />
					</Link>

					<Spacer height={30} />

					<div className={styles.headerRow}>
						<ErrorIcon />
						<h2>404 - Unknown Page</h2>
						<ErrorIcon />
					</div>
					<Spacer height={10} />
					<p>
						We don't know what page you are trying to access. It's possible that the page has been
						deleted or renamed.
					</p>
					<Spacer height={10} />
					<p>
						If you are not a developer, please contact the person or company that set Graphweaver up
						for you and tell them about this error.
					</p>
					<Spacer height={40} />
					<Button href="/" className={styles.goHomeButton}>
						Go home
					</Button>
					<Spacer height={20} />
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
		</>
	);
};
