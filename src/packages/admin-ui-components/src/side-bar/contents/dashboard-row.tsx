import classnames from 'classnames';
import { NavLink } from 'react-router-dom';

import { TableIcon } from '../../assets';

import styles from '../styles.module.css';

export const DashboardRow = ({ name, route }: { name: string; route: string }) => (
	<li>
		<NavLink
			to={route}
			className={({ isActive }) => classnames(styles.subListItem, isActive && styles.active)}
			end
		>
			<TableIcon />
			{name}
		</NavLink>
	</li>
);
