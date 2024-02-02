import { Field, useFormikContext } from 'formik';
import styles from './styles.module.css';
import { Button, CustomFieldArgs, PanelMode } from '@exogee/graphweaver-admin-ui-components';
import { useState } from 'react';

export const SecretFieldComponent = (args: CustomFieldArgs) => {
	const [hasGeneratedSecret, setHasGeneratedSecret] = useState(false);
	const { setFieldValue } = useFormikContext();

	const isCreatePanel = args.panelMode === PanelMode.CREATE;

	const handleGenerateSecret = async () => {
		// Generate secret
		await (async function () {
			const secretKey = await window.crypto.subtle.generateKey(
				{ name: 'AES-GCM', length: 256 },
				true,
				['encrypt']
			);
			const { k: secretValue } = await crypto.subtle.exportKey('jwk', secretKey);
			setFieldValue('secret', secretValue);
		})();

		const generatedKey = window.crypto.randomUUID();
		setFieldValue('key', generatedKey);

		setHasGeneratedSecret(true);
	};

	return isCreatePanel ? (
		<>
			<Button type="button" onClick={handleGenerateSecret} className={styles.btn}>
				Generate Secret and API Key
			</Button>
			<label htmlFor="secret" className={styles.fieldLabel}>
				Secret
			</label>
			<Field
				placeholder="Secret"
				id="secret"
				name="secret"
				className={styles.textInputField}
				disabled
			/>
			{hasGeneratedSecret && (
				<p>This secret will only be displayed once. Please save it in a safe place.</p>
			)}
		</>
	) : null;
};
