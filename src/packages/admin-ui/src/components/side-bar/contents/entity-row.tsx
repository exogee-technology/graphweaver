import classnames from 'classnames';
import { NavLink } from 'react-router-dom';

import { ReactComponent as TableIcon } from '~/assets/16-table.svg';
import { ReactComponent as TableIconActive } from '~/assets/16-table-light.svg';
import { routeFor } from '~/utils/route-for';
import { Entity } from '~/utils/use-schema';

import styles from '../styles.module.css';
import { WithTooltip } from '~/components';

export const EntityRow = ({ entity, isCollapsed }: { entity: Entity; isCollapsed?: boolean }) => {
	return (
		<li>
			<NavLink
				to={routeFor({ entity })}
				className={({ isActive }) => classnames(styles.subListItem, isActive && styles.active)}
			>
				{({ isActive }) => {
					const spanClass = isCollapsed
						? styles.textHidden
						: classnames(styles.subListItem, isActive && styles.active);
					return (
						<>
							{
								<WithTooltip
									content={`Entity: ${entity.name}`}
									className={classnames(styles.subListItem, styles.tooltip, styles.active)}
									direction={'right'}
									visible={isCollapsed ?? false}
								>
									{isActive ? <TableIconActive /> : <TableIcon />}
								</WithTooltip>
							}
							<span className={spanClass}>{entity.name}</span>
						</>
					);
				}}
			</NavLink>
		</li>
	);
};
