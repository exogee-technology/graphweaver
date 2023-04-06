import classnames from 'classnames';
import { NavLink } from 'react-router-dom';

import { TableIcon } from '../../assets';
import { routeFor, Entity } from '../../utils';

import styles from '../styles.module.css';

export const EntityRow = ({ entity }: { entity: Entity }) => (
	<li>
		<NavLink
			reloadDocument
			to={routeFor({ entity })}
			className={({ isActive }) => classnames(styles.subListItem, isActive && styles.active)}
		>
			<TableIcon />
			{entity.name}
		</NavLink>
	</li>
);
