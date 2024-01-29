import { ReactNode, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';

import { Button } from '../button';
import type { ButtonProps } from '../button';
import { ReactComponent as DownChevronIcon } from '../assets/16-chevron-down.svg';

import styles from './styles.module.css';
import classNames from 'classnames';

export interface DropdownItem {
	id: string /** Unique ID for this item */;
	href?: string /** href to link to */;
	name: string /** Label to appear for the dropdown item */;
	onClick?():
		| void
		| boolean /** Event emitted when the dropdown item is clicked- return false to prevent closing the dropdown  */;
	renderAfter?(): ReactNode /** Render function after the item */;
}

export interface DropdownProps extends Partial<ButtonProps> {
	items: Array<DropdownItem> /** List of items in the dropdown */;
	className?: string /** Make button look like textfield not button */;
	defaultValue?: DropdownItem;
	isDropup?: boolean /** Make dropdown appear above the button */;
}

export const Dropdown = ({
	items,
	children,
	defaultValue,
	isDropup = false,
	...props
}: DropdownProps): JSX.Element => {
	const [isOpen, setIsOpen] = useState(false);

	function handleOnClickItem(item: DropdownItem) {
		return () => {
			const result = item.onClick?.();
			if (result !== false) setIsOpen(false);
		};
	}

	function handleOnClickOutside() {
		setIsOpen(false);
		props.onClickOutside?.();
	}

	function handleOnClickButton() {
		setIsOpen(!isOpen);
		props.onClick?.();
	}

	const DropDownList = useMemo(
		() => (
			<>
				{items.map((item) => (
					<li key={item.id}>
						{!item.href ? (
							<span onClick={handleOnClickItem(item)}>{item.name}</span>
						) : (
							<a href={item.href} onClick={handleOnClickItem(item)}>
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
		<Button {...props} onClickOutside={handleOnClickOutside} onClick={handleOnClickButton}>
			{defaultValue?.name ?? children}
			<ul
				className={classNames(
					{ [styles.dropdownList]: isOpen && !isDropup },
					{ [styles.hide]: !isOpen },
					{ [styles.dropup]: isOpen && isDropup }
				)}
			>
				{DropDownList}
			</ul>

			<DownChevronIcon />
		</Button>
	);
};
