import React, { ReactNode } from 'react';
import styles from '../styles.module.css';

/**
 * Props for the Col component
 */
export interface ColProps {
	/** React children to be rendered inside the column */
	children: ReactNode;
	/** Number of grid columns this element should span (default: 1) */
	span?: number;
}

/**
 * A column component designed to be used within the Grid component.
 * Allows specifying how many columns the element should span.
 *
 * @param props - The component props
 * @returns The Col component
 *
 * @example
 * ```tsx
 * <Col span={4}>Content</Col>
 * ```
 */
export const Col: React.FC<ColProps> = ({ children, span = 1 }) => {
	return (
		<div
			className={styles.col}
			style={{
				gridColumn: `span ${span}`,
			}}
		>
			{children}
		</div>
	);
};
