import { useEffect, useRef, useState } from 'react';

import { SideBar } from '../../side-bar';
import { RequireSchema } from '../../require-schema';
import styles from './styles.module.css';
import clsx from 'clsx';
import { Modal } from '../../modal';
import { MenuIcon } from '../../assets/menu';

const SIDEBAR_MIN_WIDTH = 220;
const SIDEBAR_MAX_WIDTH = 820;
const SIDEBAR_START_WIDTH = 320;

export const DefaultLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
	const resizer = useRef<HTMLDivElement>(null);
	const [flexBasis, setFlexBasis] = useState(SIDEBAR_START_WIDTH);
	const [openMenu, setOpenMenu] = useState(false);

	const resize = (e: { x: number }) => {
		const size = e.x;
		if (size >= SIDEBAR_MIN_WIDTH && size <= SIDEBAR_MAX_WIDTH) setFlexBasis(e.x);
	};

	useEffect(() => {
		const removeListener = () => {
			document.removeEventListener('mousemove', resize, false);
		};

		const trackMovement = (event: any) => {
			if (resizer.current && resizer.current?.contains(event?.target as HTMLDivElement)) {
				document.addEventListener('mousemove', resize, false);
				document.addEventListener('mouseup', removeListener, false);
			}
		};

		document.addEventListener('mousedown', trackMovement);
		return () => {
			document.removeEventListener('mousedown', trackMovement);
			document.removeEventListener('mouseup', removeListener);
		};
	}, []);

	const handleOpenMenu = () => setOpenMenu(true);
	const handleCloseMenu = () => setOpenMenu(false);

	return (
		<RequireSchema>
			<div className={styles.wrapper}>
				<div className={styles.container}>
					<div className={styles.titleBar} onClick={handleOpenMenu}>
						<MenuIcon />
					</div>
					<div className={styles.sidebar} style={{ flexBasis: `${flexBasis}px` }}>
						<SideBar />
					</div>
					<div className={styles.resizer} ref={resizer}></div>
					<div className={styles.content}>{children}</div>
				</div>
			</div>
			<Modal
				key={'sidebar-menu'}
				isOpen={openMenu}
				onRequestClose={handleCloseMenu}
				shouldCloseOnEsc
				shouldCloseOnOverlayClick
				className={openMenu ? clsx(styles.sideMenu, styles.slideIn) : styles.sideMenu}
				modalContent={<SideBar />}
			/>
		</RequireSchema>
	);
};
