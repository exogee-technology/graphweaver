import classnames from 'classnames';
import { Link } from 'react-router-dom';

import { ReactComponent as TableIcon } from '~/assets/16-table.svg';
import { routeFor } from '~/utils/route-for';
import { Entity } from '~/utils/use-schema';
import { useSelectedEntity } from '~/utils/use-selected-entity';

import styles from './styles.module.css';

export const EntityRow = ({ entity }: { entity: Entity }) => {
	const { selectedEntity } = useSelectedEntity();
	const selected =
		entity.backendId === selectedEntity?.backendId && entity.name === selectedEntity?.name;

	return (
		<li>
			<Link
				to={routeFor({ entity })}
				className={classnames(styles.subListItem, selected && styles.active)}
			>
				<TableIcon />
				{entity.name}
			</Link>
		</li>
	);
};
