import classnames from 'classnames';
import { NavLink } from 'react-router-dom';

import { SettingsIcon } from '../../assets';

import styles from '../styles.module.css';

export const SettingsRow = ({ name, route }: { name: string; route: string }) => (
	<li>
		<NavLink
			to={route}
			className={({ isActive }) => classnames(styles.listItem, isActive && styles.active)}
			end
		>
			<SettingsIcon />
			{name}
		</NavLink>
	</li>
);
