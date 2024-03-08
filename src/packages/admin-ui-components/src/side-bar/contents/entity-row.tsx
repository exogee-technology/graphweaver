import clsx from 'clsx';
import { NavLink } from 'react-router-dom';

import { TableIcon } from '../../assets';
import { routeFor, Entity } from '../../utils';

import styles from '../styles.module.css';

export const EntityRow = ({ entity }: { entity: Entity }) => (
	<li>
		<NavLink
			to={routeFor({ entity })}
			className={({ isActive }) => clsx(styles.subListItem, isActive && styles.active)}
		>
			<TableIcon />
			<span className={styles.subListItemText}>{entity.name}</span>
		</NavLink>
	</li>
);
