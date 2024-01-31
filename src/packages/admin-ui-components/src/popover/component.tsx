import { ReactNode, useState, useMemo, useCallback } from 'react';

import { Button } from '../button';
import type { ButtonProps } from '../button';
import { ReactComponent as DownChevronIcon } from '../assets/16-chevron-down.svg';

import styles from './styles.module.css';
import classNames from 'classnames';

export interface PopoverItem {
	id: string /** Unique ID for this item */;
	href?: string /** href to link to */;
	name: string /** Label to appear for the Popover item */;
	onClick?():
		| void
		| boolean /** Event emitted when the Popover item is clicked- return false to prevent closing the Popover  */;
	renderAfter?(): ReactNode /** Render function after the item */;
	className?: string;
}

export interface PopoverProps extends Partial<ButtonProps> {
	items: Array<PopoverItem> /** List of items in the Popover */;
	className?: string /** Make button look like textfield not button */;
	defaultValue?: PopoverItem;
	position?: 'top' | 'bottom';
}

export const Popover = ({
	items,
	children,
	defaultValue,
	position = 'bottom',
	...props
}: PopoverProps): JSX.Element => {
	const [isOpen, setIsOpen] = useState(false);

	const handleOnClickItem = (item: PopoverItem) => {
		return () => {
			const result = item.onClick?.();
			if (result !== false) setIsOpen(false);
		};
	};

	const handleOnOutsideClick = useCallback(
		(e: React.MouseEvent<HTMLElement>) => {
			const target = e.target;
			if (target instanceof Element) {
				if (target.id && items.some((item) => item.id === target.id)) {
					return;
				}
			}
			console.log(typeof e.target);
			// if the click was on an element with an id that matches an item id, don't close the Popover

			setIsOpen(false);
		},
		[items]
	);

	const handleOnClickButton = () => {
		setIsOpen(!isOpen);
		props.onClick?.();
	};

	const PopoverList = useMemo(
		() => (
			<>
				{items.map((item) => (
					<li key={item.id}>
						{!item.href ? (
							<span id={item.id} className={item.className} onClick={handleOnClickItem(item)}>
								{item.name}
							</span>
						) : (
							<a
								id={item.id}
								className={item.className}
								href={item.href}
								onClick={handleOnClickItem(item)}
							>
								{item.name}
							</a>
						)}
						{item.renderAfter?.()}
					</li>
				))}
			</>
		),
		[items]
	);

	return (
		<>
			<Button {...props} onClickOutside={handleOnOutsideClick} onClick={handleOnClickButton}>
				{defaultValue?.name ?? children}

				<DownChevronIcon />
			</Button>
			<ul
				className={classNames(
					{ [styles.popoverList]: isOpen && position === 'bottom' },
					{ [styles.hide]: !isOpen },
					{ [styles.dropup]: isOpen && position === 'top' }
				)}
			>
				{PopoverList}
			</ul>
		</>
	);
};
