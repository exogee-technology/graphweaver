import styles from './styles.module.css';

export const DetailPanelFieldLabel = ({ fieldName }: { fieldName: string }) => (
	<label htmlFor={fieldName} className={styles.detailPanelFieldLabel}>
		{fieldName}
	</label>
);
