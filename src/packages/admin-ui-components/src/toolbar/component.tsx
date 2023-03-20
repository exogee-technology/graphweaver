import { Button } from '../button';
import { Dropdown } from '../dropdown';
import type { DropdownItem } from '../dropdown';

import { ReactComponent as OpenPlaygroundIcon } from '../assets/16-open-external.svg';
import { ReactComponent as FilterIcon } from '../assets/16-filter.svg';
import styles from './styles.module.css';
import { Link } from 'react-router-dom';

export interface ToolBarProps {
	title?: string;
	subtitle?: string;
}

export const ToolBar = ({ title, subtitle }: ToolBarProps) => {
	const filterItems: DropdownItem[] = [
		{
			id: 'test',
			name: 'Test',
			onClick: () => {
				alert('Clicked Test');
			},
		},
	];

	const externalLinkItems: DropdownItem[] = [
		{
			id: 'google',
			name: 'Google',
			href: 'https://google.com/',
			renderAfter: () => <OpenPlaygroundIcon />,
		},
	];

	return (
		<div className={styles.toolBarWrapper}>
			<div className="titleWrapper">
				<h1>{title}</h1>
				<p className="subtext">{subtitle}</p>
			</div>

			<div className={styles.toolsWrapper}>
				<input className={styles.search} type="search" name="search" placeholder="Search..." />

				<Dropdown items={filterItems} renderBefore={() => <FilterIcon />}>
					Filter
				</Dropdown>

				<Link to={{ pathname: '/playground' }} target="_blank" rel="noopener noreferrer">
					<Button renderAfter={() => <OpenPlaygroundIcon />}>Open playground</Button>
				</Link>

				<Dropdown items={externalLinkItems}>Links</Dropdown>
			</div>
		</div>
	);
};
