import { useEffect, useRef, useState } from 'react';

import { SideBar } from '../../side-bar';
import { Header } from '../../header';
import { RequireSchema } from '../../require-schema';
import styles from './styles.module.css';

const SIDEBAR_MIN_WIDTH = 220;
const SIDEBAR_MAX_WIDTH = 820;
const SIDEBAR_START_WIDTH = 320;

export const DefaultLayout = ({
	header,
	children,
}: {
	header?: React.ReactNode;
	children: React.ReactNode;
}) => {
	const resizer = useRef<HTMLDivElement>(null);
	const [flexBasis, setFlexBasis] = useState(SIDEBAR_START_WIDTH);

	const resize = (e: { x: number }) => {
		const size = e.x;
		if (size > SIDEBAR_MIN_WIDTH && size < SIDEBAR_MAX_WIDTH) setFlexBasis(e.x);
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

	return (
		<RequireSchema>
			<div className={styles.wrapper}>
				<div className={styles.container}>
					<div className={styles.sidebar} style={{ flexBasis: `${flexBasis}px` }}>
						<SideBar />
					</div>
					<div className={styles.resizer} ref={resizer}></div>
					<div className={styles.content}>
						<header>
							<Header>{header}</Header>
						</header>
						{children}
					</div>
					{/** @todo <footer className={styles.footer}></footer> */}
				</div>
			</div>
		</RequireSchema>
	);
};
