import classnames from 'classnames';
import { NavLink } from 'react-router-dom';

import { ReactComponent as TableIcon } from '~/assets/16-table.svg';
import { routeFor } from '~/utils/route-for';
import { Entity } from '~/utils/use-schema';

import styles from '../styles.module.css';

export const EntityRow = ({ entity }: { entity: Entity }) => (
	<li>
		<NavLink
			to={routeFor({ entity })}
			className={({ isActive }) => classnames(styles.subListItem, isActive && styles.active)}
		>
			<TableIcon />
			{entity.name}
		</NavLink>
	</li>
);
