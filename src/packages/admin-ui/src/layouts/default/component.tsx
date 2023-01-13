import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Header, SideBar } from '~/components';
import styles from './styles.module.css';

const SIDEBAR_CSS_MAX_WIDTH = 300;
const SIDEBAR_CSS_OPT_WIDTH = 250;
const SIDEBAR_CSS_MIN_WIDTH = 100;
// See CSS grid def
const CSS_DRAGBAR_WIDTH = '6px';
const CSS_CONTENT_WIDTH = '1fr';
// Current default is grid-template-columns: 300px 6px 1fr;
const CSS_DEFAULT_GRID_TEMPLATE_COLUMNS = [
	`${SIDEBAR_CSS_MAX_WIDTH}px`,
	CSS_DRAGBAR_WIDTH,
	CSS_CONTENT_WIDTH,
];

export const DefaultLayout = ({
	header,
	children,
}: {
	header?: React.ReactNode;
	children: React.ReactNode;
}) => {
	const sidebarRef = useRef<HTMLDivElement>(null);
	const containerRef = useRef<HTMLDivElement>(null);

	const [isResizing, setIsResizing] = useState(false);
	const [isCollapsed, setIsCollapsed] = useState(false);
	const [sidebarWidth, setSidebarWidth] = useState(SIDEBAR_CSS_OPT_WIDTH);

	const startResizing = useCallback(() => setIsResizing(true), []);

	const stopResizing = useCallback(() => {
		setIsResizing(false);
	}, []);

	const resize = useCallback(
		(mouseMoveEvent: MouseEvent) => {
			if (isResizing && sidebarRef.current && containerRef.current) {
				let trySidebarWidth =
					mouseMoveEvent.clientX - sidebarRef.current.getBoundingClientRect().left;
				trySidebarWidth =
					trySidebarWidth < SIDEBAR_CSS_MIN_WIDTH
						? SIDEBAR_CSS_MIN_WIDTH
						: trySidebarWidth > SIDEBAR_CSS_MAX_WIDTH
						? SIDEBAR_CSS_MAX_WIDTH
						: trySidebarWidth;
				setSidebarWidth(trySidebarWidth);

				const newGridTemplateColumns = [
					`${trySidebarWidth}px`,
					CSS_DRAGBAR_WIDTH,
					CSS_CONTENT_WIDTH,
				];
				containerRef.current.style.gridTemplateColumns = newGridTemplateColumns.join(' ');

				// TODO: Debounce this?
				setIsCollapsed(trySidebarWidth <= SIDEBAR_CSS_MIN_WIDTH);
			}
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
		<div className={styles.container} ref={containerRef}>
			<header>
				<Header>{header}</Header>
			</header>
			<div className={styles.nav} ref={sidebarRef}>
				<SideBar width={sidebarWidth} isCollapsed={isCollapsed} />
			</div>
			<div className={styles.dragbar} onMouseDown={startResizing} />
			<div className={styles.content}>{children}</div>
			<footer className={styles.footer}>{/* TODO: */ ''}</footer>
		</div>
	);
};
