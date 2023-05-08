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
}

export const ToolBar = ({ title, subtitle }: ToolBarProps) => {
	const { selectedEntity } = useSelectedEntity();
	const [search] = useSearchParams();
	const { filters, sort } = decodeSearchParams(search);

	if (!selectedEntity) throw new Error('There should always be a selected entity at this point.');

	const externalLinkItems: DropdownItem[] = [
		{
			id: 'new',
			name: `New ${selectedEntity.name}`,
			href: routeFor({ entity: selectedEntity, id: 'graphweaver-admin-new-entity', sort, filters }),
		},
	];

	return (
		<div className={styles.toolBarContainer}>
			<div className={styles.toolBarWrapper}>
				<div className="titleWrapper">
					<h1>{title}</h1>
					<p className="subtext">{subtitle}</p>
				</div>

				<div className={styles.toolsWrapper}>
					<input className={styles.search} type="search" name="search" placeholder="Search..." />
					<Link to={{ pathname: '/playground' }} target="_blank" rel="noopener noreferrer">
						<Button>
							Open playground
							<OpenPlaygroundIcon />
						</Button>
					</Link>

					<Dropdown items={externalLinkItems}>Links</Dropdown>
				</div>
			</div>
			<FilterBar key={`filterBar:${title}:${subtitle}`} iconBefore={<FilterIcon />} />
		</div>
	);
};
