import classNames from 'classnames';
import classnames from 'classnames';
import { NavLink } from 'react-router-dom';

import { ReactComponent as TableIcon } from '~/assets/16-table.svg';
import { ReactComponent as TableIconActive } from '~/assets/16-table-light.svg';
import { routeFor } from '~/utils/route-for';

import styles from '../styles.module.css';

export const DashboardRow = ({
	name,
	tenantId,
	collapsed,
}: {
	name: string;
	tenantId?: string;
	collapsed?: boolean;
}) => (
	<li>
		<NavLink
			to={routeFor({ dashboard: name, tenantId })}
			// className={({ isActive }) => classnames(styles.subListItem, isActive && styles.active)}
			end
		>
			{({ isActive }) => (
				<>
					{isActive ? <TableIconActive /> : <TableIcon />}
					<span
						data-tooltip-for={name}
						className={classnames(
							styles.subListItem,
							isActive && styles.active,
							collapsed && styles.textHidden
						)}
					>
						{name}
						{/* <span className={classNames(collapsed ? styles.tooltiptext : styles.invisible)}>
			{name}
		</span> */}
					</span>
				</>
			)}
		</NavLink>
	</li>
);

{
	/* <TableIcon />
{name} */
}
