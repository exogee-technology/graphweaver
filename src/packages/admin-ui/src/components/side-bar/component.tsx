import { useQuery } from '@apollo/client';
import classnames from 'classnames';
import { Link } from 'react-router-dom';
import { ReactComponent as GraphweaverLogo } from '~/assets/graphweaver-logo.svg';
import { useSchema } from '~/utils/use-schema';

import { BackendRow } from './backend-row';
import { DashboardRow } from './dashboard-row';
import { TenantsResult, TENANTS_QUERY } from './graphql';
import styles from './styles.module.css';

export const SideBar = () => {
	const schema = useSchema();
	const { data, loading } = useQuery<TenantsResult>(TENANTS_QUERY);

	if (loading) return <p>'Loading...'</p>;

	return (
		<div className={styles.sideBar}>
			<Link to="/">
				<GraphweaverLogo width="52" className={styles.logo} />
			</Link>

			<p className={styles.subtext}>Dashboards</p>
			<ul className={classnames(styles.entity, styles.closed)}>
				<DashboardRow name="All" />
				{data?.result.map((tenant) => (
					<DashboardRow key={tenant.id} name={tenant.tenantName} tenantId={tenant.id} />
				))}
			</ul>

			<p className={styles.subtext}>Data Sources</p>

			{schema.backends.map((backend) => (
				<BackendRow key={backend} backend={backend} />
			))}
		</div>
	);
};
