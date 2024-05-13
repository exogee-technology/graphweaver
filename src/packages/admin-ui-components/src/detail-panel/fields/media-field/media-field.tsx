import { useState } from 'react';
import { useField, useFormikContext } from 'formik';
import { useMutation } from '@apollo/client';

import { EntityField } from '../../../utils';
import { getUploadUrlMutation } from '../../graphql';
import { Button } from '../../../button';
import { useAutoFocus } from '../../../hooks';

import styles from './styles.module.css';

export const uploadFileToSignedURL = async (uploadURL: string, file: any) => {
	try {
		const response = await fetch(uploadURL, {
			method: 'PUT',
			body: file,
			headers: {
				'Content-Type': file.type,
			},
		});

		if (response.ok) {
			return file.name;
		} else {
			console.error('Error uploading file:', response.statusText);
		}
	} catch (error) {
		console.error('Error uploading to storage provider and creating submission:', error);
	}
};

export const MediaField = ({ field, autoFocus }: { field: EntityField; autoFocus: boolean }) => {
	const { setValues } = useFormikContext();
	const [mediaHasChanged, setMediaHasChanged] = useState(false);
	const [_, meta] = useField({ name: field.name, multiple: false });
	const { initialValue: downloadUrl } = meta;
	const [getUploadUrl] = useMutation(getUploadUrlMutation);

	const inputRef = useAutoFocus<HTMLInputElement>(autoFocus);

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
					<input
						className={styles.fileInput}
						type="file"
						onChange={handleFileInputChange}
						ref={inputRef}
					/>
				</div>
			)}
		</div>
	);
};
