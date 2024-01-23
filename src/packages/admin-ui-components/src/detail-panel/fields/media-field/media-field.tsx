import { useField, useFormikContext } from 'formik';
import { EntityField } from '../../../utils';
import { useMutation } from '@apollo/client';
import { getUploadUrlMutation } from '../../graphql';
import { useState } from 'react';
import styles from './styles.module.css';
import { Button } from '../../../button';

export const MediaField = ({ field }: { field: EntityField }) => {
	const { setValues } = useFormikContext();
	const [mediaHasChanged, setMediaHasChanged] = useState(false);
	const [_, meta] = useField({ name: field.name, multiple: false });
	const { initialValue: downloadUrl } = meta;
	const [getUploadUrl] = useMutation(getUploadUrlMutation);

	const handleFileUpload = async (file: any) => {
		const res = await getUploadUrl({ variables: { key: file.name } });
		const uploadURL = res.data.getUploadUrl;
		if (!uploadURL) {
			console.error('Upload URL is not available');
			return;
		}

		if (!field.extensions?.key) {
			console.error('Key not found on field extentions');
			return;
		}
		const mediaKey = field.extensions.key;

		setValues((prev: any) => ({
			...prev,
			uploadUrl: uploadURL,
			file: file,
			// overwrite the key form field value with the field.extensions.key
			[mediaKey]: file.name,
		}));
		setMediaHasChanged(true);
	};

	const handleFileInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
		if (event.target.files) {
			handleFileUpload(event.target.files[0]);
		}
	};

	const handleOnDelete = () => {
		setValues((prev: any) => ({
			...prev,
			key: null,
			uploadUrl: null,
			file: null,
			downloadUrl: null,
		}));
		setMediaHasChanged(true);
	};

	return (
		<div>
			{downloadUrl ? (
				<>
					<div className={styles.row}>
						<Button type="button" onClick={handleOnDelete}>
							Delete
						</Button>
						<input className={styles.fileInput} type="file" onChange={handleFileInputChange} />
					</div>
					{!mediaHasChanged && (
						<a href={downloadUrl} target="_blank" rel="noreferrer">
							{downloadUrl}
						</a>
					)}
				</>
			) : (
				<div className={styles.row}>
					<input className={styles.fileInput} type="file" onChange={handleFileInputChange} />
				</div>
			)}
		</div>
	);
};
