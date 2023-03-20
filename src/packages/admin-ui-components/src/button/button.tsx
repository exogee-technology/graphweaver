import classNames from 'classnames';
import { useState, useEffect, useRef, useMemo, ReactNode } from 'react';
import styles from './styles.module.css';

export interface ButtonProps {
	onClick?(): any /** Event emitted when clicked */;
	onClickOutside?(): any /** Event emitted when outside */;
	className?: string /** alternative styling */;
	children?: ReactNode;
	type?: 'submit' | 'reset' | 'button';
}

export const Button = ({
	onClick,
	children,
	onClickOutside,
	className,
	type = 'button',
}: ButtonProps): JSX.Element => {
	const buttonRef = useRef<HTMLButtonElement>(null);

	function handleOnClickButton() {
		onClick?.();
	}

	function handleMouseDownEvent(event: DocumentEventMap['mousedown']) {
		// No ref or target to compare? Return with no action
		if (!buttonRef?.current || !event.target) {
			return;
		}

		// Target of the click is the button,return with no action.
		// @todo check children as well?
		if (buttonRef.current.contains(event.target as Node)) {
			return;
		}

		// Otherwise, click was outside the element, emit an event.
		onClickOutside?.();
	}

	useEffect(() => {
		// Register mousedown listeners to capture outside click
		document.addEventListener('mousedown', handleMouseDownEvent);
		return () => {
			document.removeEventListener('mousedown', handleMouseDownEvent);
		};
	}, []);

	return (
		<button
			ref={buttonRef}
			onClick={handleOnClickButton}
			className={classNames([className, styles.button])}
			type={type}
		>
			{children}
		</button>
	);
};
