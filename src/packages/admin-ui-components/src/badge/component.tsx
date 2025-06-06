import { ReactNode } from 'react';
import styles from './styles.module.css';

/**
 * Props for the Badge component
 */
export interface BadgeProps {
	/**
	 * Visual style variant of the badge
	 * - `primary`: High-importance labels with brand color
	 * - `secondary`: Medium-importance labels with softer appearance
	 * - `greyscale`: Low-emphasis labels with neutral appearance
	 */
	variant: 'primary' | 'secondary' | 'greyscale';

	/**
	 * Content to display inside the badge
	 * Keep text concise - badges work best with 1-2 words
	 */
	children: ReactNode;

	/**
	 * Optional icon or element to display before the badge text
	 * Useful for adding visual context or category indicators
	 *
	 * @example
	 * iconPrefix={<StarIcon />}
	 * iconPrefix="🏷️"
	 */
	iconPrefix?: ReactNode;

	/**
	 * Optional icon or element to display after the badge text
	 * Useful for supplementary information or status indicators
	 *
	 * @example
	 * iconSuffix={<ChevronIcon />}
	 * iconSuffix="✨"
	 */
	iconSuffix?: ReactNode;

	/**
	 * Optional click handler to make the badge interactive
	 * When provided, the badge becomes clickable and keyboard accessible
	 * Use for actions like filtering, navigation, or toggling states
	 */
	onClick?: () => void;

	/**
	 * Optional additional CSS class names to apply custom styling
	 * Will be merged with the default badge classes
	 */
	className?: string;
}

/**
 * Badge component for displaying status indicators, labels, and tags
 *
 * A versatile labeling element that provides quick visual context for content.
 * Badges can display text, icons, or both to communicate important information at a glance.
 *
 * @example
 * ```tsx
 * // Basic badge
 * <Badge variant="primary">New</Badge>
 *
 * // Badge with icons
 * <Badge
 *   variant="secondary"
 *   iconPrefix="🎯"
 *   iconSuffix="🚀"
 * >
 *   Featured
 * </Badge>
 *
 * // Interactive badge
 * <Badge
 *   variant="greyscale"
 *   onClick={() => handleFilter('category')}
 * >
 *   Category
 * </Badge>
 * ```
 *
 * @param props - The badge configuration options
 * @returns A rendered badge component
 */
export const Badge = ({
	variant,
	children,
	iconPrefix,
	iconSuffix,
	onClick,
	className,
}: BadgeProps) => {
	return (
		<button
			className={`${styles.badge} ${styles[variant]} ${className || ''}`}
			onClick={onClick}
			type="button"
		>
			{iconPrefix && <span className={styles.iconPrefix}>{iconPrefix}</span>}
			<span className={styles.text}>{children}</span>
			{iconSuffix && <span className={styles.iconSuffix}>{iconSuffix}</span>}
		</button>
	);
};
