import styles from './styles.module.css';

import { Button } from '../button';
import { useState } from 'react';
import { Dropdown } from '../dropdown';

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
	const [showActionsDropdown, setShowActionsDropdown] = useState(false);
	const handleDeselect = () => {
		setSelectedRows(new Set());
	};

	const handleActions = () => {
		console.log('handleActions');
		setShowActionsDropdown(true);
	};
	return (
		<>
			{selectedRows.size > 0 && (
				<div className={styles.selectedRowsContainer}>
					<span>
						{selectedRows.size} row{selectedRows.size > 1 ? 's' : ''} selected
					</span>
					<div className={styles.buttonsContainer}>
						<Button onClick={handleDeselect}>Deselect</Button>
						<Dropdown
							items={[{ id: 'delete-items', name: 'Delete', onClick: handleDelete }]}
							isDropup
						>
							Actions
						</Dropdown>
					</div>
				</div>
			)}

			{/* {showActionsDropdown && (
				<Dropdown items={[{ id: 'delete-items', name: 'Delete', onClick: () => {} }]}>
					Actions
				</Dropdown>
			)} */}
		</>
	);
};
