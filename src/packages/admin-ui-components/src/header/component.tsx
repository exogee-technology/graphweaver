import styles from './styles.module.css';

export const Header = ({ children }: { children?: React.ReactNode }) => {
	return <div className={styles.header}>{children}</div>;
};
