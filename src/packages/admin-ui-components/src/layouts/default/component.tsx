import React from 'react';
import { SideBar } from '../../side-bar';
import styles from './styles.module.css';

export const DefaultLayout = ({ children }: { children: React.ReactNode }) => (
	<div className={styles.wrapper}>
		<SideBar />
		{children}
	</div>
);
