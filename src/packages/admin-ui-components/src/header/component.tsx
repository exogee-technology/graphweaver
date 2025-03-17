import type { ReactNode } from 'react';
import styles from './styles.module.css';

export interface HeaderProps {
	children?: ReactNode;
}

export const Header = ({ children }: HeaderProps) => (
	<header>
		<div className={styles.header}>{children}</div>
	</header>
);
