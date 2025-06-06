import clsx from 'clsx';
import { AnimatePresence, motion } from 'motion/react';
import React, { ReactNode, useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import styles from './styles.module.css';

/**
 * Content render props for the PopoverMenu component.
 */
interface PopoverContentProps {
	/** Function to close the popover */
	onClose: () => void;
	/** Whether the popover is currently open */
	isOpen: boolean;
}

/**
 * Props for the PopoverMenu component.
 */
interface PopoverMenuProps {
	/** The trigger element that opens the popover */
	trigger: ReactNode;
	/** The content to display inside the popover - can be ReactNode or render function */
	content: ReactNode | ((props: PopoverContentProps) => ReactNode);
	/** Optional title for the popover */
	title?: string;
	/** Optional description for the popover */
	description?: string;
	/** Whether the popover is initially open */
	defaultOpen?: boolean;
	/** Controlled open state */
	open?: boolean;
	/** Callback when open state changes */
	onOpenChange?: (open: boolean) => void;
	/** CSS class name for the trigger wrapper */
	className?: string;
	/** CSS class name for the popover content */
	popoverClassName?: string;
	/** Position of the popover relative to trigger */
	placement?:
		| 'top'
		| 'bottom'
		| 'left'
		| 'right'
		| 'top-start'
		| 'top-end'
		| 'bottom-start'
		| 'bottom-end';
	/** Offset from the trigger element */
	offset?: number;
	/** Whether to close on click outside */
	closeOnClickOutside?: boolean;
	/** Whether to close when pressing escape */
	closeOnEscape?: boolean;
	/** Whether to use a portal to render outside the DOM tree (recommended for table cells) */
	usePortal?: boolean;
}

/**
 * A flexible popover/dropdown menu component with smooth animations.
 *
 * @param props - The component props
 * @returns The rendered PopoverMenu component
 */
export const PopoverMenu: React.FC<PopoverMenuProps> = ({
	trigger,
	content,
	title,
	description,
	defaultOpen = false,
	open: controlledOpen,
	onOpenChange,
	className,
	popoverClassName,
	placement = 'bottom-start',
	offset = 8,
	closeOnClickOutside = true,
	closeOnEscape = true,
	usePortal = true,
}) => {
	const [internalOpen, setInternalOpen] = useState(defaultOpen);
	const [position, setPosition] = useState({ top: 0, left: 0 });
	const triggerRef = useRef<HTMLDivElement>(null);
	const popoverRef = useRef<HTMLDivElement>(null);

	// Use controlled or internal state
	const isOpen = controlledOpen !== undefined ? controlledOpen : internalOpen;

	const setIsOpen = useCallback(
		(newOpen: boolean) => {
			if (controlledOpen === undefined) {
				setInternalOpen(newOpen);
			}
			onOpenChange?.(newOpen);
		},
		[controlledOpen, onOpenChange]
	);

	// Calculate position for portal/fixed positioning with viewport collision detection
	const calculatePosition = useCallback(() => {
		if (!triggerRef.current) return;

		const triggerRect = triggerRef.current.getBoundingClientRect();

		// Get viewport dimensions
		const viewportWidth = window.innerWidth;
		const viewportHeight = window.innerHeight;

		// Estimated popover dimensions (will be refined when popover is rendered)
		const estimatedPopoverWidth = 250; // Based on min-width and typical content
		const estimatedPopoverHeight = 150; // Estimated based on typical content

		let top = 0;
		let left = 0;
		let actualPlacement = placement;

		// Calculate initial position based on placement (viewport-relative for fixed positioning)
		switch (placement) {
			case 'top':
				top = triggerRect.top - offset - estimatedPopoverHeight;
				left = triggerRect.left + triggerRect.width / 2 - estimatedPopoverWidth / 2;
				break;
			case 'top-start':
				top = triggerRect.top - offset - estimatedPopoverHeight;
				left = triggerRect.left;
				break;
			case 'top-end':
				top = triggerRect.top - offset - estimatedPopoverHeight;
				left = triggerRect.right - estimatedPopoverWidth;
				break;
			case 'bottom':
				top = triggerRect.bottom + offset;
				left = triggerRect.left + triggerRect.width / 2 - estimatedPopoverWidth / 2;
				break;
			case 'bottom-start':
				top = triggerRect.bottom + offset;
				left = triggerRect.left;
				break;
			case 'bottom-end':
				top = triggerRect.bottom + offset;
				left = triggerRect.right - estimatedPopoverWidth;
				break;
			case 'left':
				top = triggerRect.top + triggerRect.height / 2 - estimatedPopoverHeight / 2;
				left = triggerRect.left - offset - estimatedPopoverWidth;
				break;
			case 'right':
				top = triggerRect.top + triggerRect.height / 2 - estimatedPopoverHeight / 2;
				left = triggerRect.right + offset;
				break;
			default:
				top = triggerRect.bottom + offset;
				left = triggerRect.left;
		}

		// Viewport collision detection and adjustment
		const margin = 8; // Minimum distance from viewport edge

		// Check and adjust horizontal position
		if (left < margin) {
			left = margin;
		} else if (left + estimatedPopoverWidth > viewportWidth - margin) {
			left = viewportWidth - estimatedPopoverWidth - margin;
		}

		// Check and adjust vertical position with placement flipping if needed
		if (top < margin) {
			// If top placement would go above viewport, try flipping to bottom
			if (actualPlacement.includes('top')) {
				top = triggerRect.bottom + offset;
				actualPlacement = actualPlacement.replace('top', 'bottom') as typeof placement;
			} else {
				top = margin;
			}
		} else if (top + estimatedPopoverHeight > viewportHeight - margin) {
			// If bottom placement would go below viewport, try flipping to top
			if (actualPlacement.includes('bottom')) {
				top = triggerRect.top - offset - estimatedPopoverHeight;
				actualPlacement = actualPlacement.replace('bottom', 'top') as typeof placement;

				// Double-check if flipped position is still too high
				if (top < margin) {
					top = margin;
				}
			} else {
				top = viewportHeight - estimatedPopoverHeight - margin;
			}
		}

		setPosition({ top, left });
	}, [placement, offset]);

	// Update position when opened or on scroll/resize
	useEffect(() => {
		if (!isOpen || !usePortal) return;

		calculatePosition();

		const handleReposition = () => calculatePosition();
		window.addEventListener('scroll', handleReposition, true);
		window.addEventListener('resize', handleReposition);

		return () => {
			window.removeEventListener('scroll', handleReposition, true);
			window.removeEventListener('resize', handleReposition);
		};
	}, [isOpen, usePortal, calculatePosition]);

	// Toggle popover
	const togglePopover = useCallback(() => {
		setIsOpen(!isOpen);
	}, [isOpen, setIsOpen]);

	// Close popover
	const closePopover = useCallback(() => {
		setIsOpen(false);
	}, [setIsOpen]);

	// Handle click outside
	useEffect(() => {
		if (!isOpen || !closeOnClickOutside) return;

		const handleClickOutside = (event: MouseEvent) => {
			if (
				triggerRef.current &&
				popoverRef.current &&
				!triggerRef.current.contains(event.target as Node) &&
				!popoverRef.current.contains(event.target as Node)
			) {
				closePopover();
			}
		};

		document.addEventListener('mousedown', handleClickOutside);
		return () => document.removeEventListener('mousedown', handleClickOutside);
	}, [isOpen, closeOnClickOutside, closePopover]);

	// Handle escape key
	useEffect(() => {
		if (!isOpen || !closeOnEscape) return;

		const handleEscape = (event: KeyboardEvent) => {
			if (event.key === 'Escape') {
				closePopover();
			}
		};

		document.addEventListener('keydown', handleEscape);
		return () => document.removeEventListener('keydown', handleEscape);
	}, [isOpen, closeOnEscape, closePopover]);

	// Animation variants
	const popoverVariants = {
		hidden: {
			opacity: 0,
			scale: 0.95,
			y: placement.includes('top') ? 10 : placement.includes('bottom') ? -10 : 0,
			x: placement.includes('left') ? 10 : placement.includes('right') ? -10 : 0,
		},
		visible: {
			opacity: 1,
			scale: 1,
			y: 0,
			x: 0,
		},
		exit: {
			opacity: 0,
			scale: 0.95,
			y: placement.includes('top') ? 10 : placement.includes('bottom') ? -10 : 0,
			x: placement.includes('left') ? 10 : placement.includes('right') ? -10 : 0,
		},
	};

	// Calculate popover position classes (for non-portal mode)
	const getPositionClasses = () => {
		if (usePortal) return ''; // No position classes needed for portal mode

		const positionMap = {
			top: styles.positionTop,
			bottom: styles.positionBottom,
			left: styles.positionLeft,
			right: styles.positionRight,
			'top-start': styles.positionTopStart,
			'top-end': styles.positionTopEnd,
			'bottom-start': styles.positionBottomStart,
			'bottom-end': styles.positionBottomEnd,
		};
		return positionMap[placement] || styles.positionBottomStart;
	};

	// Get transform origin based on placement
	const getTransformOrigin = () => {
		const originMap = {
			top: 'center bottom',
			'top-start': 'left bottom',
			'top-end': 'right bottom',
			bottom: 'center top',
			'bottom-start': 'left top',
			'bottom-end': 'right top',
			left: 'right center',
			right: 'left center',
		};
		return originMap[placement] || 'left top';
	};

	// Render popover content
	const popoverContent = (
		<AnimatePresence>
			{isOpen && (
				<motion.div
					ref={popoverRef}
					className={clsx(
						styles.popover,
						usePortal ? styles.popoverPortal : getPositionClasses(),
						popoverClassName
					)}
					style={
						{
							...(usePortal
								? {
										position: 'fixed',
										top: position.top,
										left: position.left,
										transformOrigin: getTransformOrigin(),
									}
								: {
										'--offset': `${offset}px`,
									}),
						} as React.CSSProperties
					}
					variants={popoverVariants}
					initial="hidden"
					animate="visible"
					exit="exit"
					transition={{
						type: 'spring',
						duration: 0.2,
						bounce: 0.1,
					}}
					role="menu"
					aria-label={title || 'Popover menu'}
				>
					{/* Optional Header */}
					{(title || description) && (
						<div className={styles.header}>
							{title && <h3 className={styles.title}>{title}</h3>}
							{description && <p className={styles.description}>{description}</p>}
						</div>
					)}

					{/* Content */}
					<div className={styles.content}>
						{typeof content === 'function' ? content({ onClose: closePopover, isOpen }) : content}
					</div>
				</motion.div>
			)}
		</AnimatePresence>
	);

	return (
		<div
			className={clsx(
				styles.popoverWrapper,
				!usePortal && styles.popoverWrapperPositioned,
				className
			)}
		>
			{/* Trigger */}
			<div
				ref={triggerRef}
				className={styles.trigger}
				onClick={togglePopover}
				role="button"
				tabIndex={0}
				aria-expanded={isOpen}
				aria-haspopup="true"
				onKeyDown={(e) => {
					if (e.key === 'Enter' || e.key === ' ') {
						e.preventDefault();
						togglePopover();
					}
				}}
			>
				{trigger}
			</div>

			{/* Render popover content either in portal or inline */}
			{usePortal
				? typeof document !== 'undefined' && createPortal(popoverContent, document.body)
				: popoverContent}
		</div>
	);
};
