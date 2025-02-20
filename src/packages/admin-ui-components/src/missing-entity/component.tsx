import { Link } from 'wouter';
import { DataSourcesIcon } from '../assets/64-data-sources';
import styles from './styles.module.css';
import { Spacer } from '../spacer';

export const MissingEntity = ({ entity }: { entity: string }) => {
	return (
		<div className={styles.wrapper}>
			<DataSourcesIcon className={styles.dataSourceIcon} />
			<Spacer height={16} />
			<h2 className={styles.heading}>No such entity: {entity}</h2>
			<Spacer height={10} />
			<Link to="/" className={styles.text}>
				Return to home
			</Link>
		</div>
	);
};
