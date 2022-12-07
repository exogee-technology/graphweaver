import classnames from 'classnames';
import { ReactComponent as GraphweaverLogo } from '~/assets/graphweaver-logo.svg';
import { useSchema } from '~/utils/use-schema';

import { BackendRow } from './backend-row';
import { DashboardRow } from './dashboard-row';
import styles from './styles.module.css';

export const SideBar = () => {
	const schema = useSchema();

	return (
		<div className={styles.sideBar}>
			<GraphweaverLogo width="52" className={styles.logo} />

			<p className={styles.subtext}>Dashboards</p>
			<ul className={classnames(styles.entity, styles.closed)}>
				<DashboardRow name="All" />
				<DashboardRow name="Coinage" />
				<DashboardRow name="Exogee" />
			</ul>

			<p className={styles.subtext}>Data Sources</p>

			{schema.backends.map((backend) => (
				<BackendRow key={backend} backend={backend} />
			))}
		</div>
	);
};
