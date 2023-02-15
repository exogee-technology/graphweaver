import { useState, useEffect, useRef, ReactNode } from 'react';
import styles from './styles.module.css';

export interface ButtonProps {
    onClick?(): any; /** Event emitted when clicked */
    renderBefore?(): ReactNode; /** Render function before the button */
    renderAfter?(): ReactNode; /** Render function after the button */
    dropdown?: boolean; /** Is the button a dropdown menu? */
    dropdownItems?: Array<object>; /** If the button is a dropdown, the items in the dropdown @todo type me */
    children?: ReactNode;
}

export const Button = ({
    onClick,
    children,
    renderBefore,
    renderAfter,
    dropdown = false,
    dropdownItems = [{ name: 'Add links array', href: 'some_url' }],
}: ButtonProps): JSX.Element => {
	const [showDropdown, setShowDropdown] = useState(false);

    function handleOnClickButton() {
	   if(!dropdown) return;
       setShowDropdown(!showDropdown);
	}

    function handleOnOutsideClickDropdown() {
        setShowDropdown(false);
    }

    const renderDropdown: ReactNode = useMemo(() => {
        if(!dropdown) return null;
        return <Dropdown
            onOutsideClick={handleOnOutsideClickDropdown}
            getParent={getParent}
            showDropdown={showDropdown}
            dropdownItems={dropdownItems}
        />
    }, [dropdown, dropdownItems])

	// To refer to when clicking outside dropdown @todo better way to do this?
	const parentRef = useRef(null);
	function getParent() {
		return parentRef;
	}

	return (
		<button ref={parentRef} onClick={handleOnClickButton} className={styles.button} type="button">
            {renderBefore()}
			{children}
            {renderAfter()}
			{dropdown && renderDropdown()}
		</button>
	);
};
