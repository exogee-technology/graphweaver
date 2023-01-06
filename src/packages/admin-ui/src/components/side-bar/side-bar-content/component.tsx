import { useQuery } from '@apollo/client';
import classnames from 'classnames';
import { Link } from 'react-router-dom';
import { ReactComponent as GraphweaverLogo } from '~/assets/graphweaver-logo.svg';
import { useSchema } from '~/utils/use-schema';

import { BackendRow, DashboardRow } from '../contents';
import { TenantsResult, TENANTS_QUERY } from '../graphql';
import styles from '../styles.module.css';

export const SideBarContent = ({ collapsed }: { collapsed?: boolean }) => {
	const schema = useSchema();
	const { data, loading } = useQuery<TenantsResult>(TENANTS_QUERY);

	if (loading)
		return (
			<div className={styles.sideBarContent}>
				<p>'Loading...'</p>
			</div>
		);

	return (
		<div className={styles.sideBarContent}>
			<Link to="/">
				<GraphweaverLogo width="52" className={styles.logo} />
			</Link>

			<p className={styles.subtext}>Dashboards</p>
			<ul className={classnames(styles.entity, styles.closed)}>
				<DashboardRow name="All" collapsed={collapsed} />
				{data?.result.map((tenant) => (
					<DashboardRow
						key={tenant.id}
						name={tenant.tenantName}
						tenantId={tenant.id}
						collapsed={collapsed}
					/>
				))}
			</ul>

			<p className={styles.subtext}>Data Sources</p>

			{schema.backends.map((backend) => (
				<BackendRow key={backend} backend={backend} collapsed={collapsed} />
			))}
		</div>
	);
};
