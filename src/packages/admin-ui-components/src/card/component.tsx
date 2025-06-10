import React, { ReactNode } from 'react';
import styles from './styles.module.css';

interface CardProps {
	title?: string;
	description?: string;
	children: ReactNode;
}

export const Card: React.FC<CardProps> = ({ title, description, children }) => {
	return (
		<div className={styles.card}>
			{title && <h3>{title}</h3>}
			{description && <p className={styles.description}>{description}</p>}
			{children}
		</div>
	);
};

export default Card;
