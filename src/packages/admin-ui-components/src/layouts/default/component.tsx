import React from 'react';
import { SideBar } from '../../side-bar';
import { Header } from '../../header';
import { RequireSchema } from '../../require-schema';
import styles from './styles.module.css';

export const DefaultLayout = ({
	header,
	children,
}: {
	header?: React.ReactNode;
	children: React.ReactNode;
}) => (
	<RequireSchema>
		<div className={styles.container}>
			<header>
				<Header>{header}</Header>
			</header>
			<nav>
				<SideBar />
			</nav>
			<div className={styles.content}>{children}</div>
			<footer className={styles.footer}>{/* TODO: */ ''}</footer>
		</div>
	</RequireSchema>
);
