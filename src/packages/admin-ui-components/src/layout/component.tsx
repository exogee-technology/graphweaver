import { DefaultLayout } from '@exogee/graphweaver-admin-ui-components';
import React, { Children, ReactNode } from 'react';
import styles from './styles.module.css';

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
 * Props for the Col component
 */
export interface ColProps {
	/** React children to be rendered inside the column */
	children: ReactNode;
	/** Number of grid columns this element should span (default: 1) */
	span?: number;
}

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

/**
 * Props for the CustomPage component
 */
export interface CustomPageProps {
	/** The content to be rendered inside the page */
	children: React.ReactNode;
	/** The main title of the page */
	title: string;
	/** The subtitle displayed below the main title */
	subtitle?: string;
	/** Optional additional CSS class for the header */
	headerClassName?: string;
	/** Optional additional CSS class for the content area */
	contentClassName?: string;
}

/**
 * A component for custom admin pages with a standardized header and content layout.
 * Provides a consistent page structure with title, optional subtitle, and content area.
 * Renders within the DefaultLayout from graphweaver-admin-ui-components.
 *
 * @param props - The component props
 * @returns The CustomPage component
 *
 * @example
 * ```tsx
 * <CustomPage title="Dashboard" subtitle="Overview of metrics">
 *   <DashboardContent />
 * </CustomPage>
 * ```
 */
export const CustomPage: React.FC<CustomPageProps> = ({
	children,
	title,
	subtitle,
	headerClassName,
	contentClassName,
}) => {
	return (
		<DefaultLayout>
			<div className={`${styles.custom_page_header} ${headerClassName || ''}`}>
				<h1>{title}</h1>
				{subtitle && <h2>{subtitle}</h2>}
			</div>
			<div className={`${styles.custom_page_content} ${contentClassName || ''}`}>{children}</div>
		</DefaultLayout>
	);
};
