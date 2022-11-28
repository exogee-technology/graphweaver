import { useState } from 'react';

import { ReactComponent as DatabaseIcon } from '~/assets/16-database.svg';
import { ReactComponent as ChevronIcon } from '~/assets/16-chevron-down.svg';
import { Entity, useSchema } from '~/utils/use-schema';
import { EntityRow } from './entity-row';
import styles from './styles.module.css';

export const BackendRow = ({
	backend,
	selectedEntity,
	onEntitySelected,
}: {
	backend: string;
	selectedEntity?: Entity;
	onEntitySelected?: (entity: Entity) => any;
}) => {
	const { entitiesForBackend } = useSchema();
	const [expanded, setExpanded] = useState(false);

	return (
		<ul key={backend} className={styles.entity}>
			<li className={expanded ? styles.open : styles.closed}>
				<a
					href="/#"
					onClick={(e) => {
						e.preventDefault();
						setExpanded(!expanded);
					}}
				>
					<DatabaseIcon />
					{backend}
					<ChevronIcon />
				</a>
				<ul>
					{entitiesForBackend(backend).map((entity) => (
						<EntityRow
							entity={entity}
							key={entity.name}
							handleClick={() => onEntitySelected?.(entity)}
							selected={selectedEntity?.name === entity.name}
						/>
					))}
				</ul>
			</li>
		</ul>
	);
};
