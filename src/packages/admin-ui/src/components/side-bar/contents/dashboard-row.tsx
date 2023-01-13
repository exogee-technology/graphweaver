import classnames from 'classnames';
import { NavLink } from 'react-router-dom';

import { ReactComponent as TableIcon } from '~/assets/16-table.svg';
import { ReactComponent as TableIconActive } from '~/assets/16-table-light.svg';
import { routeFor } from '~/utils/route-for';

import styles from '../styles.module.css';
import { WithTooltip } from '~/components';

export const DashboardRow = ({
	name,
	tenantId,
	isCollapsed,
}: {
	name: string;
	tenantId?: string;
	isCollapsed?: boolean;
}) => (
	<li>
		<NavLink
			to={routeFor({ dashboard: name, tenantId })}
			className={({ isActive }) => classnames(styles.subListItem, isActive && styles.active)}
			end
		>
			{({ isActive }) => {
				const spanClass = isCollapsed
					? styles.textHidden
					: classnames(styles.subListItem, isActive && styles.active);

				return (
					<>
						{
							<WithTooltip
								content={`Dashboards: ${name}`}
								className={classnames(styles.subListItem, styles.tooltip, styles.active)}
								direction={'right'}
								visible={isCollapsed ?? false}
							>
								{isActive ? <TableIconActive /> : <TableIcon />}
							</WithTooltip>
						}
						<span className={spanClass}>{name}</span>
					</>
				);
			}}
		</NavLink>
	</li>
);
