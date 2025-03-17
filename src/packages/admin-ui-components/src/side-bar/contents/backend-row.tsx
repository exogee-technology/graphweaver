import { useState } from 'react';

import { DatabaseIcon, ChevronDownIcon } from '../../assets';
import { useSchema } from '../../utils/use-schema';
import { useSelectedEntity } from '../../utils/use-selected-entity';
import { EntityRow } from './entity-row';
import styles from '../styles.module.css';

export const BackendRow = ({
	backendDisplayName,
	defaultOpen,
}: {
	backendDisplayName: string;
	defaultOpen: boolean;
}) => {
	const { entitiesForBackendDisplayName, backendIdsForDisplayName } = useSchema();
	const { selectedEntity } = useSelectedEntity();
	const [expanded, setExpanded] = useState(
		(!selectedEntity && defaultOpen) ||
			(selectedEntity?.backendId &&
				backendIdsForDisplayName(backendDisplayName).has(selectedEntity.backendId))
	);

	const entities = entitiesForBackendDisplayName(backendDisplayName)
		.filter((entity) => !entity.hideInSideBar)
		.sort((left, right) => left.name.localeCompare(right.name));

	if (entities?.length === 0) return null;

	return (
		<ul key={backendDisplayName}>
			<li className={expanded ? styles.open : styles.closed}>
				<a
					href="/#"
					onClick={(e) => {
						e.preventDefault();
						setExpanded(!expanded);
					}}
				>
					<DatabaseIcon />
					<div className={styles.dataSourceTitle}>{backendDisplayName}</div>
					<ChevronDownIcon />
				</a>
				<ul>
					{entities && entities.map((entity) => <EntityRow key={entity.name} entity={entity} />)}
				</ul>
			</li>
		</ul>
	);
};
