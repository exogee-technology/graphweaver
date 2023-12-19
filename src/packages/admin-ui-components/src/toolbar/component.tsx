import { Link, useSearchParams } from 'react-router-dom';

import { Button } from '../button';
import { Dropdown } from '../dropdown';
import type { DropdownItem } from '../dropdown';

import { ReactComponent as OpenPlaygroundIcon } from '../assets/16-open-external.svg';
import { ReactComponent as FilterIcon } from '../assets/16-filter.svg';
import styles from './styles.module.css';

import { FilterBar } from '../filter-bar';
import { decodeSearchParams, routeFor, useSelectedEntity } from '../utils';

export interface ToolBarProps {
	title?: string;
	subtitle?: string;
	onExportToCSV: () => void;
}

export const ToolBar = ({ title, subtitle, onExportToCSV }: ToolBarProps) => {
	const { selectedEntity } = useSelectedEntity();
	const [search] = useSearchParams();
	const { filters, sort } = decodeSearchParams(search);

	if (!selectedEntity) throw new Error('There should always be a selected entity at this point.');

	// @todo allow to be extended
	const externalLinkItems: DropdownItem[] = [];

	return (
		<div className={styles.toolBarContainer}>
			<div className={styles.toolBarWrapper}>
				<div className="titleWrapper">
					<h1>{title}</h1>
					<p className="subtext">{subtitle}</p>
				</div>

				<div className={styles.toolsWrapper}>
					<Link
						className={styles.toolBarTrailingButton}
						to={{ pathname: '/playground' }}
						target="_blank"
						rel="noopener noreferrer"
						aria-label={`Open Playground`}
					>
						<Button>
							Open Playground
							<OpenPlaygroundIcon />
						</Button>
					</Link>
					<Button className={styles.toolBarTrailingButton} onClick={onExportToCSV}>
						Export to CSV
					</Button>
					<Link
						className={styles.toolBarTrailingButton}
						to={routeFor({
							entity: selectedEntity,
							id: 'graphweaver-admin-new-entity',
							sort,
							filters,
						})}
						aria-label={`Create New ${selectedEntity.name}`}
					>
						<Button disabled={selectedEntity.attributes.isReadOnly}>
							Create New {selectedEntity.name}
						</Button>
					</Link>

					{externalLinkItems.length > 0 && <Dropdown items={externalLinkItems}>Links</Dropdown>}
				</div>
			</div>
			<FilterBar key={`filterBar:${title}:${subtitle}`} iconBefore={<FilterIcon />} />
		</div>
	);
};
