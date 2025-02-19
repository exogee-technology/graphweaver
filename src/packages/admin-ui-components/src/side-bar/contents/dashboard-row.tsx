import clsx from 'clsx';
import { Link, useRoute } from 'wouter';

import { TableIcon } from '../../assets';

import styles from '../styles.module.css';

export const DashboardRow = ({
	name,
	route,
	end,
}: {
	name: string;
	route: string;
	end?: boolean;
}) => {
	const [isActive] = useRoute(end ? route : `${route}/*`);

	return (
		<li>
			<Link to={route} className={clsx(styles.subListItem, isActive && styles.active)}>
				<TableIcon />
				{name}
			</Link>
		</li>
	);
};
