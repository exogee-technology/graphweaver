import { useState, useRef, useEffect } from 'react';
import styles from './styles.module.css';

const DropdownItem = ({
	handleClick,
	children,
}: {
	handleClick: any;
	children: JSX.Element | string;
}) => <li onClick={handleClick}>{children}</li>;

const Dropdown = ({
	showDropdown,
	onUpdate,
	onOutsideClick,
	getParent,
}: {
	showDropdown: boolean;
	onUpdate: any;
	onOutsideClick: any;
	getParent: any;
}) => {
	const handleLocal = () => {
		onUpdate('some param');
	};

	function useOutsideAlerter(ref: any) {
		useEffect(() => {
			function handleClickOutside(e: Event) {
				if (e.target === getParent().current) {
					return;
				}

				if (ref.current && !ref.current.contains(e.target)) {
					onOutsideClick();
				}
			}
			document.addEventListener('mousedown', handleClickOutside);
			return () => {
				document.removeEventListener('mousedown', handleClickOutside);
			};
		}, [ref]);
	}

	const wrapperRef = useRef(null);
	useOutsideAlerter(wrapperRef);

	return (
		(showDropdown && (
			<ul ref={wrapperRef} className={showDropdown ? styles.dropdown : styles.hide}>
				<DropdownItem handleClick={() => handleLocal()}>Some link</DropdownItem>
			</ul>
		)) ||
		null
	);
};

export const FilterButton = ({
	handleClick = () => null,
	children,
	iconBefore,
	iconAfter,
	dropdown = false,
	onUpdate,
}: {
	handleClick?: () => any;
	children: JSX.Element | string;
	iconBefore?: string;
	iconAfter?: string;
	dropdown?: boolean;
	onUpdate?: () => any;
}) => {
	const [showDropdown, setShowDropdown] = useState(false);

	function hasIconBefore() {
		if (iconBefore) {
			return <img src={iconBefore} alt="Icon" />;
		}
	}

	function hasIconAfter() {
		if (iconAfter) {
			return <img src={iconAfter} alt="Icon" />;
		}
	}

	function showHideDropdown() {
		return dropdown ? setShowDropdown(!showDropdown) : false;
	}

	// To refer to when clicking outside dropdown
	const parentRef = useRef(null);
	function getParent() {
		return parentRef;
	}

	function hasDropdown() {
		if (dropdown) {
			return (
				<Dropdown
					getParent={getParent}
					onOutsideClick={() => setShowDropdown(false)}
					showDropdown={showDropdown}
					onUpdate={onUpdate}
				/>
			);
		}
	}

	return (
		<button ref={parentRef} onClick={showHideDropdown} className={styles.button} type="button">
			<>
				{hasIconBefore()}
				{children}
				{hasIconAfter()}
				{hasDropdown()}
			</>
		</button>
	);
};
