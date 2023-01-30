import styles from './styles.module.css';

export const Loader = () => (
	<div className={styles.wrapper}>
		<div
			className={styles.blob}
			style={
				// Start at a random spot in the CSS animation so that
				// the loader appears different each time it's shown
				{ animationDelay: `-${Math.random() * 3}s` }
			}
		/>
	</div>
);
