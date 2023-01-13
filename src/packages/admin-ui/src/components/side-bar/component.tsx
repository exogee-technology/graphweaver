import { useQuery } from '@apollo/client';
import classnames from 'classnames';
import { Link } from 'react-router-dom';
import { ReactComponent as GraphweaverLogo } from '~/assets/graphweaver-logo.svg';
import { useSchema } from '~/utils/use-schema';

import { BackendRow, DashboardRow } from './contents';
import { TenantsResult, TENANTS_QUERY } from './graphql';
import styles from './styles.module.css';

export const SideBar = ({ isCollapsed, width }: { isCollapsed: boolean; width: number }) => {
	const schema = useSchema();
	const { data, loading } = useQuery<TenantsResult>(TENANTS_QUERY);

	if (loading)
		//TODO: Spinner
		return (
			<div className={styles.sideBarContent}>
				<p>'Loading...'</p>
			</div>
		);

	return (
		<div className={styles.sideBar} style={{ width }}>
			<Link to="/">
				<GraphweaverLogo width="52" className={styles.logo} />
			</Link>

			<p className={classnames(styles.subtext, isCollapsed && styles.textHidden)}>Dashboards</p>
			<ul className={classnames(styles.entity, styles.closed)}>
				<DashboardRow name="All" isCollapsed={isCollapsed} />
				{data?.result.map((tenant) => (
					<DashboardRow
						key={tenant.id}
						name={tenant.tenantName}
						tenantId={tenant.id}
						isCollapsed={isCollapsed}
					/>
				))}
			</ul>

			<p className={classnames(styles.subtext, isCollapsed && styles.textHidden)}>Data Sources</p>

			{schema.backends.map((backend) => (
				<BackendRow key={backend} backend={backend} isCollapsed={isCollapsed} />
			))}
		</div>
	);
};
