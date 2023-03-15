import classnames from 'classnames';
import { ReactNode } from 'react';
import { ExitIcon } from '../assets';

import styles from './styles.module.css';

interface FilterSelectorProps {
	showFilter?: () => void;
	active: boolean;
	clearFilter: () => void;
	children: ReactNode;
}

export const FilterSelector = ({
	showFilter,
	clearFilter,
	active,
	children,
}: FilterSelectorProps) => {
	return (
		<div className={styles.filterSelector} onClick={showFilter}>
			<div className={classnames(active && styles.inputFieldActive, styles.inputField)}>
				{children}
			</div>
			<div className={styles.indicatorWrapper}>
				<span className={styles.indicatorSeparator}></span>
				<div className={styles.indicatorContainer}>
					<ExitIcon className={styles.closeIcon} onClick={clearFilter} />
				</div>
			</div>
		</div>
	);
};
