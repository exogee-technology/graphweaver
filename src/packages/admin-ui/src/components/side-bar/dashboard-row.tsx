import classnames from 'classnames';
import { NavLink } from 'react-router-dom';

import { ReactComponent as TableIcon } from '~/assets/16-table.svg';
import { routeFor } from '~/utils/route-for';

import styles from './styles.module.css';

export const DashboardRow = ({ name }: { name: string }) => (
	<li>
		<NavLink
			to={routeFor({ dashboard: name })}
			className={({ isActive }) => classnames(styles.subListItem, isActive && styles.active)}
		>
			<TableIcon />
			{name}
		</NavLink>
	</li>
);
