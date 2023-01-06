import { useCallback, useEffect, useRef, useState } from 'react';

import { SideBarContent } from './side-bar-content';
import styles from './styles.module.css';

const SIDEBAR_CSS_MAX_WIDTH = 300;
const SIDEBAR_CSS_OPT_WIDTH = 250;

export const SideBar = () => {
	const sidebarRef = useRef<HTMLDivElement>(null);
	const [isResizing, setIsResizing] = useState(false);
	const [isCollapsed, setIsCollapsed] = useState(false);
	const [sidebarWidth, setSidebarWidth] = useState(SIDEBAR_CSS_MAX_WIDTH);

	const startResizing = useCallback(() => setIsResizing(true), []);

	const stopResizing = useCallback(() => {
		setIsResizing(false);
	}, []);

	const resize = useCallback(
		(mouseMoveEvent: MouseEvent) => {
			if (isResizing && sidebarRef.current) {
				setSidebarWidth(mouseMoveEvent.clientX - sidebarRef.current.getBoundingClientRect().left);
			}
			// TODO: Debounce this?
			setIsCollapsed(sidebarWidth < SIDEBAR_CSS_OPT_WIDTH);
		},
		[isResizing, sidebarWidth]
	);

	useEffect(() => {
		window.addEventListener('mousemove', resize);
		window.addEventListener('mouseup', stopResizing);
		return () => {
			window.removeEventListener('mousemove', resize);
			window.removeEventListener('mouseup', stopResizing);
		};
	}, [resize, stopResizing]);

	return (
		<div
			className={styles.sideBar}
			ref={sidebarRef}
			style={{ width: sidebarWidth }}
			onMouseDown={(e) => e.preventDefault()}
		>
			<SideBarContent collapsed={isCollapsed} />
			<div className={styles.sideBarResizer} onMouseDown={startResizing} />
		</div>
	);
};
