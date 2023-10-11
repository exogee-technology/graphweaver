import classnames from 'classnames';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

// This is injected by vite-plugin-graphweaver
import { customPages, NavLinkExport } from 'virtual:graphweaver-user-supplied-custom-pages';

import { GraphweaverLogo } from '../assets';
import { useSchema } from '../utils';

import { BackendRow, DashboardRow, SettingsRow } from './contents';
import { Spacer } from '../spacer';

import styles from './styles.module.css';

export const SideBar = () => {
	const schema = useSchema();
	const [loading, setLoading] = useState(true);
	const [userDashboardLinks, setUserDashboardLinks] = useState<NavLinkExport[]>([]);

	useEffect(() => {
		(async () => {
			const navLinks = customPages.navLinks ? await customPages.navLinks() : [];
			const links = navLinks
				.flat()
				.filter((navLink) => navLink?.name)
				.sort((left, right) => left.name.localeCompare(right.name));
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
				<ul className={classnames(styles.closed)}>
					{!!userDashboardLinks.length && (
						<>
							{userDashboardLinks.map((link) => (
								<DashboardRow key={link.route} name={link.name} route={link.route} />
							))}
						</>
					)}

					<SettingsRow key={'/settings'} name={'Settings'} route={'/settings'} />
				</ul>

				<p className={styles.subtext}>Data Sources</p>

				{schema.backends.map((backend) => (
					<BackendRow key={backend} backend={backend} />
				))}
			</div>

			<Spacer grow={1} />

			<div className={styles.sideBarFooter}>
				<div className={styles.footerText}>
					Powered by{' '}
					<a href="https://graphweaver.com/" target="_blank">
						Graphweaver
					</a>
				</div>
			</div>

			<Spacer height={10} />
		</div>
	);
};
