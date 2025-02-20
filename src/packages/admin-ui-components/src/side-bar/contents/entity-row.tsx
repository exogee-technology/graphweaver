import clsx from 'clsx';
import { Link, useRoute } from 'wouter';

import { TableIcon } from '../../assets';
import { routeFor, Entity } from '../../utils';

import styles from '../styles.module.css';

export const EntityRow = ({ entity }: { entity: Entity }) => {
	const entityRoute = routeFor({ entity });
	const [isActive] = useRoute(`${entityRoute}/*?`);

	return (
		<li>
			<Link
				to={entityRoute}
				className={clsx(styles.subListItem, isActive && styles.active)}
				data-testid={`${entity.name}-entity-link`}
			>
				<TableIcon />
				<span className={styles.subListItemText}>{entity.name}</span>
			</Link>
		</li>
	);
};
