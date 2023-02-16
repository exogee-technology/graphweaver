import { ReactNode, useState, useMemo } from 'react';

import { Button } from '../button';
import type { ButtonProps } from '../button';
import { ReactComponent as DownChevronIcon } from '../assets/16-chevron-down.svg';

import styles from './styles.module.css';

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
}

export const Dropdown = ({ items, children, ...props }: DropdownProps): JSX.Element => {
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
						<a href={item.href} onClick={handleOnClickItem(item)}>
							{item.name}
						</a>
						{item.renderAfter?.()}
					</li>
				))}
			</>
		),
		[items]
	);

	return (
		<Button
			renderAfter={() => <DownChevronIcon />}
			{...props}
			onClickOutside={handleOnClickOutside}
			onClick={handleOnClickButton}
		>
			{children}
			<ul className={isOpen ? styles.dropdown : styles.hide}>{DropDownList}</ul>
		</Button>
	);
};
