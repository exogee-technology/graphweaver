import React, { Children, ReactNode } from 'react';
import styles from '../styles.module.css';
import { Row } from '../row';

/**
 * Props for the Grid component
 */
export interface GridProps {
	/** React children to be rendered inside the grid */
	children: ReactNode;
	/** Number of columns in the grid layout (default: 12) */
	cols?: number;
	/** Gap between grid items in pixels (default: 16) */
	gap?: number;
	/** Maximum number of rows per column before creating a new column */
	maxRowsPerColumn?: number;
}

/**
 * A responsive grid layout component that creates a CSS grid with configurable columns and gaps.
 * If maxRowsPerColumn is provided, the Grid will automatically distribute Row children across
 * multiple columns when the number of rows exceeds the maximum.
 *
 * @param props - The component props
 * @returns The Grid component
 *
 * @example
 * ```tsx
 * <Grid cols={12} gap={20}>
 *   <Col span={6}>Column 1</Col>
 *   <Col span={6}>Column 2</Col>
 * </Grid>
 * ```
 *
 * @example
 * ```tsx
 * <Grid cols={3} maxRowsPerColumn={5} gap={16}>
 *   <Row>Row 1</Row>
 *   <Row>Row 2</Row>
 *   ...
 * </Grid>
 * ```
 */
export const Grid: React.FC<GridProps> = ({ children, cols = 12, gap = 16, maxRowsPerColumn }) => {
	// If maxRowsPerColumn is provided and children are Row components, distribute them across columns
	if (maxRowsPerColumn && maxRowsPerColumn > 0) {
		const childArray = Children.toArray(children);
		const isRowChildren =
			childArray.length > 0 &&
			childArray.every((child) => React.isValidElement(child) && child.type === Row);

		if (isRowChildren) {
			const rowComponents = childArray as React.ReactElement[];
			const columnGroups: React.ReactElement[][] = [];

			// Split rows into column groups based on maxRowsPerColumn
			for (let i = 0; i < rowComponents.length; i += maxRowsPerColumn) {
				columnGroups.push(rowComponents.slice(i, i + maxRowsPerColumn));
			}

			// Create columns with rows
			return (
				<div
					className={styles.grid}
					style={{
						gridTemplateColumns: `repeat(${Math.min(cols, columnGroups.length)}, 1fr)`,
						gap: `${gap}px`,
					}}
				>
					{columnGroups.map((rowGroup, index) => (
						<div key={index} className={styles.col}>
							{rowGroup}
						</div>
					))}
				</div>
			);
		}
	}

	// Default grid rendering
	return (
		<div
			className={styles.grid}
			style={{
				gridTemplateColumns: `repeat(${cols}, 1fr)`,
				gap: `${gap}px`,
			}}
		>
			{children}
		</div>
	);
};
