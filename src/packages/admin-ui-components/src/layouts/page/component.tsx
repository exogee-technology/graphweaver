import { DefaultLayout } from '../default';
import React from 'react';
import styles from '../styles.module.css';

/**
 * Props for the Page component
 */
export interface PageProps {
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
 * @returns The Page component
 *
 * @example
 * ```tsx
 * <Page title="Dashboard" subtitle="Overview of metrics">
 *   <DashboardContent />
 * </Page>
 * ```
 */
export const Page: React.FC<PageProps> = ({
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
