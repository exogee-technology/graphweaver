import classnames from 'classnames';

import { ReactComponent as TableIcon } from '~/assets/16-table.svg';
import { Entity } from '~/utils/use-schema';

import styles from './styles.module.css';

export const EntityRow = ({
	entity,
	handleClick,
	selected,
}: {
	entity: Entity;
	handleClick?: () => any;
	selected: boolean;
}) => (
	<li>
		<a
			onClick={(e) => {
				e.preventDefault();
				handleClick?.();
			}}
			className={classnames(styles.subListItem, selected && styles.active)}
		>
			<TableIcon />
			{entity.name}
		</a>
	</li>
);
