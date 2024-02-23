import { Link, useRouteError } from 'react-router-dom';
import { GraphweaverLogo, Spacer } from '..';
import { ErrorIcon } from '../assets';
import styles from './styles.module.css';

export const DefaultErrorFallback = () => {
	const error = useRouteError();

	// Ensure we log the error to the console so the developer can see it.
	console.error(error);

	return (
		<div className={styles.wrapper}>
			<div className={styles.errorBox}>
				<Link to="/" className={styles.logoWrapper}>
					<GraphweaverLogo width="52" />
				</Link>

				<Spacer height={30} />

				<div className={styles.headerRow}>
					<ErrorIcon />
					<h2>Unhandled Error</h2>
					<ErrorIcon />
				</div>
				<Spacer height={10} />
				<p>
					An error was generated while trying to show this page which has been logged to the
					console.
				</p>
				<Spacer height={10} />
				<p>
					If you are not a developer, please contact the person or company that set Graphweaver up
					for you and tell them about this error.
				</p>
				<Spacer height={10} />
				<p>
					If you are a developer, this is likely a problem in a custom field or page. It could also
					be a problem in Graphweaver itself. If you believe this is a Graphweaver bug, please{' '}
					<a href="" target="_blank">
						open a GitHub issue
					</a>
					.
				</p>
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
