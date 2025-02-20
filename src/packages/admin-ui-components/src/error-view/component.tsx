import { Link } from 'wouter';
import { RequestIcon } from '../assets/request';
import styles from './styles.module.css';
import { Spacer } from '../spacer';
import { Button } from '../button';

export const ErrorView = ({ message }: { message: string }) => {
	return (
		<div className={styles.wrapper}>
			<RequestIcon />
			<h2 className={styles.title}>Request Error</h2>
			<span className={styles.text}>{message}</span>
			<Link to="/">
				<Button>Return to home</Button>
			</Link>
			<Spacer height={80} />
		</div>
	);
};
