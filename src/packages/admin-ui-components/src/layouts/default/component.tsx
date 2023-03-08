import React, { useState } from 'react';
import { SideBar } from '../../side-bar';
import { Header } from '../../header';
import { RequireSchema } from '../../require-schema';
import styles from './styles.module.css';
import { DataContext, DataStateByEntity } from '../../utils';

export const DefaultLayout = ({
	header,
	children,
}: {
	header?: React.ReactNode;
	children: React.ReactNode;
}) => {
	const [entityState, setEntityState] = useState<DataStateByEntity>({});
	return (
		<RequireSchema>
			<DataContext.Provider value={{ entityState, setEntityState }}>
				<div className={styles.container}>
					<header>
						<Header>{header}</Header>
					</header>
					<nav>
						<SideBar />
					</nav>
					<div className={styles.content}>{children}</div>
					{/** @todo <footer className={styles.footer}></footer> */}
				</div>
			</DataContext.Provider>
		</RequireSchema>
	);
};
