import clsx from 'clsx';
import { useEffect, useRef, PropsWithChildren } from 'react';
import { Spinner, SpinnerSize } from '../spinner';
import styles from './styles.module.css';
import { useNavigate } from 'react-router-dom';

export interface ButtonProps {
	onClick?(): any /** Event emitted when clicked */;
	onClickOutside?(e: MouseEvent): any /** Event emitted when outside */;
	href?: string;
	className?: string;
	type?: 'submit' | 'reset' | 'button';
	disabled?: boolean;
	loading?: boolean;
}

export const Button = ({
	onClick,
	children,
	onClickOutside,
	className,
	href,
	type = 'button',
	disabled = false,
	loading = false,
}: PropsWithChildren<ButtonProps>): JSX.Element => {
	const buttonRef = useRef<HTMLButtonElement>(null);
	const navigate = useNavigate();

	if (onClick && href) {
		console.warn(
			'Button component: You have provided both an onClick and an href. The onClick will be ignored in favor of the href.'
		);
	}

	const handleMouseDownEvent = (event: MouseEvent) => {
		// No ref or target to compare? Return with no action
		if (!buttonRef?.current || !event.target) {
			return;
		}

		// Target of the click is the button or its children, return with no action.
		if (buttonRef.current.contains(event.target as Node)) {
			return;
		}

		// Otherwise, click was outside the element, emit an event.
		onClickOutside?.(event);
	};

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
			onClick={() => {
				if (href) navigate(href);
				else onClick?.();
			}}
			className={clsx([className, styles.button, disabled && styles.disabled])}
			type={type}
			disabled={disabled}
		>
			{loading ? <Spinner size={SpinnerSize.SMALL} /> : children}
		</button>
	);
};
