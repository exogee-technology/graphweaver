import React from 'react';
import { SideBar } from '~/components';
import styles from './styles.module.css';

export const DefaultLayout = ({ children }: { children: React.ReactNode }) => (
	<div className={styles.wrapper}>
		<SideBar />
		<div className={styles.content}>{children}</div>
	</div>
);
