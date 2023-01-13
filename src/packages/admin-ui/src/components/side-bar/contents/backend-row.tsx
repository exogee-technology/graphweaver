import { useState } from 'react';

import { ReactComponent as DatabaseIcon } from '~/assets/16-database.svg';
import { ReactComponent as ChevronIcon } from '~/assets/16-chevron-down.svg';
import { useSchema } from '~/utils/use-schema';
import { useSelectedEntity } from '~/utils/use-selected-entity';
import { EntityRow } from './entity-row';
import styles from '../styles.module.css';
import classNames from 'classnames';
import { WithTooltip } from '~/components';

export const BackendRow = ({
	backend,
	isCollapsed,
}: {
	backend: string;
	isCollapsed?: boolean;
}) => {
	const { entitiesForBackend } = useSchema();
	const { selectedEntity } = useSelectedEntity();
	const [expanded, setExpanded] = useState(selectedEntity?.backendId === backend);

	const entities = entitiesForBackend(backend)?.sort((left, right) =>
		left.name.localeCompare(right.name)
	);

	const spanClass = isCollapsed ? styles.textHidden : classNames(styles.subListItem);

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
					<WithTooltip
						content={`Data Sources: ${backend}`}
						className={classNames(styles.subListItem, styles.tooltip, styles.active)}
						direction={'right'}
						visible={isCollapsed ?? false}
					>
						<DatabaseIcon />
					</WithTooltip>

					<span className={spanClass}>{backend}</span>
					<ChevronIcon />
				</a>
				<ul>
					{entities &&
						entities.map((entity) => (
							<EntityRow key={entity.name} entity={entity} isCollapsed={isCollapsed} />
						))}
				</ul>
			</li>
		</ul>
	);
};
