import styles from './styles.module.css';

export const DetailPanelFieldLabel = ({
	fieldName,
	required,
}: {
	fieldName: string;
	required?: boolean;
}) => (
	<label htmlFor={fieldName} className={styles.detailPanelFieldLabel}>
		{fieldName}
		{required && (
			<span aria-hidden="true" className={styles.required}>
				*
			</span>
		)}
	</label>
);
