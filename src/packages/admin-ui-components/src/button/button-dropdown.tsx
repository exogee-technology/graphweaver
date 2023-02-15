import { useState, useEffect, useRef, ReactNode } from 'react';
import styles from './styles.module.css';

export interface ButtonDropdownProps {
    showDropdown: boolean; /** Is the dropdown currently visible? */
    dropdownItems: Array<object>; /** List of items in the dropdown @todo type */
    onOutsideClick: any; /** Event emitted when a click occurs outside the dropdown */
    getParent(): any; /** ? */
}

export const ButtonDropdown = ({
	showDropdown,
	dropdownItems,
	onOutsideClick,
	getParent,
}: ButtonDropdownProps): JSX.Element => {

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

    if(!showDropdown) return null;

    return (<ul ref={wrapperRef} className={showDropdown ? styles.dropdown : styles.hide}>
{items.map((item: any) => (
        <li key={Math.random()}>
            <a href={item.href}>{item.name}</a>
        </li>    </ul>);
};