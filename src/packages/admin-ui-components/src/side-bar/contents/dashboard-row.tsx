import clsx from 'clsx';
import { NavLink } from 'react-router-dom';

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
}) => (
	<li>
		<NavLink
			to={route}
			className={({ isActive }) => clsx(styles.subListItem, isActive && styles.active)}
			end={end}
		>
			<TableIcon />
			{name}
		</NavLink>
	</li>
);
