import classnames from 'classnames';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

// This is injected by vite-plugin-graphweaver
import { dashboards, NavLinkExport } from 'virtual:graphweaver-user-supplied-dashboards';

import { GraphweaverLogo } from '../assets';
import { useSchema } from '../utils';

import { BackendRow, DashboardRow } from './contents';

import styles from './styles.module.css';

export const SideBar = () => {
	const schema = useSchema();
	const [loading, setLoading] = useState(true);
	const [userDashboardLinks, setUserDashboardLinks] = useState<NavLinkExport[]>([]);

	useEffect(() => {
		(async () => {
			const links = (await Promise.all(dashboards.map(({ navLinks }) => navLinks())))
				.flat()
				.filter((navLink) => navLink?.name);
			links.sort((left, right) => left.name.localeCompare(right.name));
			setUserDashboardLinks(links);
			setLoading(false);
		})();
	}, []);

	if (loading)
		return (
			<div className={styles.sideBar}>
				<p>Loading...</p>
			</div>
		);

	return (
		<div className={styles.sideBar}>
			<Link to="/">
				<GraphweaverLogo width="52" className={styles.logo} />
			</Link>

			<div className={styles.sideBarContent}>
				{!!userDashboardLinks.length && (
					<>
						<p className={styles.subtext}>Dashboards</p>
						<ul
							//className={classnames(styles.entity, styles.closed)}
							className={classnames(styles.closed)}
						>
							{userDashboardLinks.map((link) => (
								<DashboardRow key={link.route} name={link.name} route={link.route} />
							))}
						</ul>
					</>
				)}

				<p className={styles.subtext}>Data Sources</p>

				{schema.backends.map((backend) => (
					<BackendRow key={backend} backend={backend} />
				))}
			</div>
		</div>
	);
};
