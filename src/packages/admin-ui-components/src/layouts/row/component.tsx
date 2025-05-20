import React, { ReactNode } from 'react';
import styles from '../styles.module.css';

/**
 * Props for the Row component
 */
export interface RowProps {
	/** React children to be rendered inside the row */
	children: ReactNode;
	/** Optional additional CSS class for the row */
	className?: string;
	/** Gap between row items in pixels (default: 16) */
	gap?: number;
}

/**
 * A row component designed to be used within the Grid component.
 * When used with Grid's maxRowsPerColumn prop, rows will automatically
 * distribute across multiple columns.
 *
 * @param props - The component props
 * @returns The Row component
 *
 * @example
 * ```tsx
 * <Row gap={8}>Row content</Row>
 * ```
 */
export const Row: React.FC<RowProps> = ({ children, className, gap = 16 }) => {
	return (
		<div className={`${styles.row} ${className || ''}`} style={{ marginBottom: `${gap}px` }}>
			{children}
		</div>
	);
};
