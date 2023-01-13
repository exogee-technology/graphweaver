import classNames from 'classnames';
import { useCallback, useState } from 'react';
import styles from './styles.module.css';

export const WithTooltip = ({
	content,
	className,
	visible,
	direction,
	children,
}: {
	content: string;
	className?: string;
	hover?: boolean;
	visible: boolean;
	direction?: 'top' | 'left' | 'right' | 'bottom';
	children: React.ReactNode;
}) => {
	// let timeout;
	const [active, setActive] = useState(false);

	const showTip = useCallback(() => {
		console.log('SHOWTIP/VISIBLE', visible);
		// timeout = setTimeout(() => {
		setActive(true);
		// }, props.delay || 400);
	}, []);

	const hideTip = useCallback(() => {
		// clearInterval(timeout);
		setActive(false);
	}, []);

	return (
		<div
			className={classNames(className, styles.tooltipWrapper)}
			// When to show the tooltip
			onMouseEnter={showTip}
			onMouseLeave={hideTip}
		>
			{children}
			{active && visible && (
				<div className={classNames(styles.tooltip, styles[`${direction}`] || styles.top)}>
					{content}
				</div>
			)}
		</div>
	);
};
