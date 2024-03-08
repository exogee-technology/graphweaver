import clsx from 'clsx';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

import { graphweaverLogo, localStorageAuthKey } from '../config';
import { Logout } from '../logout';

// This is injected by vite-plugin-graphweaver
import { customPages, NavLinkExport } from 'virtual:graphweaver-user-supplied-custom-pages';

import { GraphweaverLogo } from '../assets';
import { useSchema } from '../utils';

import { BackendRow, DashboardRow } from './contents';
import { Spacer } from '../spacer';

import styles from './styles.module.css';

export const SideBar = () => {
	const schema = useSchema();
	const [loading, setLoading] = useState(true);
	const [imageLoaded, setImageLoading] = useState(false);
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

	const handleOnImageLoad = () => {
		setImageLoading(true);
	};

	if (loading)
		return (
			<div className={styles.sideBar}>
				<p>Loading...</p>
			</div>
		);

	return (
		<div className={styles.sideBar}>
			<Link to="/">
				<img
					/*
						This image is being loaded from our servers for analytics purposes. 
						We do not store any personal data, only the hostname of the page where 
						the Admin UI is used and the IP address of the request. 
						Without this, we have no idea how much adoption Graphweaver is getting 
						or who is using it. There is no further tracking of any kind used in 
						this product. If you disagree with us collecting this information, 
						please raise a GitHub issue, we’re happy to discuss.
					*/
					src={`${graphweaverLogo}?hostname=${window.location.hostname}`}
					width="52"
					className={clsx({
						[styles.logo]: imageLoaded,
						[styles.logoLoading]: !imageLoaded,
					})}
					onLoad={handleOnImageLoad}
				/>
				{!imageLoaded && <GraphweaverLogo width="52" className={styles.logo} />}
			</Link>

			<div className={styles.sideBarContent}>
				{!!userDashboardLinks.length && (
					<>
						<p className={styles.subtext}>Dashboards</p>
						<ul
							//className={classnames(styles.entity, styles.closed)}
							className={clsx(styles.closed)}
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

			<Spacer grow={1} />

			{localStorage.getItem(localStorageAuthKey) ? (
				<Logout />
			) : (
				<div className={styles.sideBarFooter}>
					<div className={styles.footerText}>
						Powered by{' '}
						<a href="https://graphweaver.com/" target="_blank">
							Graphweaver
						</a>
					</div>
				</div>
			)}

			<Spacer height={10} />
		</div>
	);
};
