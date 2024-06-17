import { useMemo } from 'react';

import { FilterBar } from '../filter-bar';
import { TitleBar } from '../title-bar';
import { FilterIcon } from '../assets/16-filter';
import styles from './styles.module.css';

export interface ToolBarProps {
	title: string;
	subtitle: string;
	onExportToCSV: () => void;
}

export const ToolBar = ({ title, subtitle, onExportToCSV }: ToolBarProps) => {
	// We want to memoize this because when the title and subtitle props change we don't want to re-render
	// the filter bar. If someone has clicked a filter it'll close on re-render, which is not necessary.
	// It has no real dependencies we pass in via props either, so we can just roll with it.
	const filterBar = useMemo(() => <FilterBar iconBefore={<FilterIcon />} />, []);

	return (
		<div className={styles.toolBarContainer}>
			<TitleBar title={title} subtitle={subtitle} onExportToCSV={onExportToCSV} />
			{filterBar}
		</div>
	);
};
