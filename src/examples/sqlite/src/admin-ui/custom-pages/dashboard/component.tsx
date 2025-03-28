import { DefaultLayout } from '@exogee/graphweaver-admin-ui-components';
import { SalesOverTimePerEmployee } from './sales-over-time-per-employee';
import { GenrePopularity } from './genre-popularity';
import styles from './styles.module.css';

export const Dashboard = () => {
	return (
		<DefaultLayout>
			<div className={styles.container}>
				<h1>Sales per employee over time</h1>
				<SalesOverTimePerEmployee />
				<h1>Customer preferences by genre</h1>
				<GenrePopularity />
			</div>
		</DefaultLayout>
	);
};
