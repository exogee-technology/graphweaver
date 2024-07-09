import styles from './styles.module.css';

import { Button } from '../button';
import { Popover } from '../popover';
import { RowSelectionState } from '@tanstack/react-table';

export interface SelectionBarProps {
	selectedRows: RowSelectionState;
	setSelectedRows: (selectedRows: RowSelectionState) => void;
	handleDelete: () => void;
}

export const SelectionBar = ({
	selectedRows,
	setSelectedRows,
	handleDelete,
}: SelectionBarProps) => {
	const handleDeselect = () => {
		setSelectedRows({});
	};

	const rows = new Set(Object.keys(selectedRows));
	return (
		<>
			{rows.size > 0 && (
				<div className={styles.selectedRowsContainer}>
					<span>
						{rows.size} row{rows.size > 1 ? 's' : ''} selected
					</span>
					<div className={styles.buttonsContainer}>
						<Button type="reset" onClick={handleDeselect}>
							Deselect
						</Button>
						<Popover
							items={[
								{
									id: 'delete-items',
									name: `Delete selected row${rows.size === 1 ? '' : 's'}`,
									onClick: handleDelete,
									className: styles.deleteSelectedRows,
								},
							]}
							position="top"
						>
							Actions
						</Popover>
					</div>
				</div>
			)}
		</>
	);
};
