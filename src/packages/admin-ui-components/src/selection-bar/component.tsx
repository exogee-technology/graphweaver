import styles from './styles.module.css';

import { Button } from '../button';
import { Popover } from '../popover';

export interface SelectionBarProps {
	selectedRows: ReadonlySet<string>;
	setSelectedRows: (selectedRows: Set<string>) => void;
	handleDelete: () => void;
}

export const SelectionBar = ({
	selectedRows,
	setSelectedRows,
	handleDelete,
}: SelectionBarProps) => {
	const handleDeselect = () => {
		setSelectedRows(new Set());
	};
	return (
		<>
			{selectedRows.size > 0 && (
				<div className={styles.selectedRowsContainer}>
					<span>
						{selectedRows.size} row{selectedRows.size > 1 ? 's' : ''} selected
					</span>
					<div className={styles.buttonsContainer}>
						<Button type="reset" onClick={handleDeselect}>
							Deselect
						</Button>
						<Popover
							items={[
								{
									id: 'delete-items',
									name: `Delete selected row${selectedRows.size === 1 ? '' : 's'}`,
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
