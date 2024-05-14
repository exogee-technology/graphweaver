import { useState } from 'react';
import { useField, useFormikContext } from 'formik';
import { useMutation } from '@apollo/client';

import { EntityField } from '../../../utils';
import { getDeleteUrlMutation, getUploadUrlMutation } from '../../graphql';
import { Button } from '../../../button';
import { useAutoFocus } from '../../../hooks';

import styles from './styles.module.css';
import toast from 'react-hot-toast';

export const deleteFileToSignedURL = async (deleteURL: string) => {
	const response = await fetch(deleteURL, {
		method: 'DELETE',
	});

	if (response.ok) {
		return true;
	} else {
		throw new Error(`Error deleting file: ${response?.statusText}`);
	}
};

export const uploadFileToSignedURL = async (uploadURL: string, file: any) => {
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
		throw new Error(`Error uploading file: ${response?.statusText}`);
	}
};

export const MediaField = ({ field, autoFocus }: { field: EntityField; autoFocus: boolean }) => {
	const { setValues } = useFormikContext();
	const [mediaHasChanged, setMediaHasChanged] = useState(false);
	const [_, meta] = useField({ name: field.name, multiple: false });
	const { initialValue: media } = meta;
	const [getUploadUrl] = useMutation(getUploadUrlMutation);
	const [getDeleteUrl] = useMutation(getDeleteUrlMutation);

	const inputRef = useAutoFocus<HTMLInputElement>(autoFocus);

	const handleFileUpload = async (file: any) => {
		const res = await getUploadUrl({ variables: { key: file.name } });
		const uploadUrl = res.data.getUploadUrl;
		if (!uploadUrl) {
			console.error('Upload URL is not available');
			toast.error('Unable to upload file, please try again later.');
			return;
		}

		let deleteUrl = null;
		if (media) {
			const deleteRes = await getDeleteUrl({ variables: { key: media.filename } });
			deleteUrl = deleteRes.data.getDeleteUrl;
			if (!deleteUrl) {
				console.error('Delete URL is not available');
				toast.error('Unable to delete file, please try again later.');
				return;
			}
		}

		setValues((prev: any) => ({
			...prev,
			uploadUrl: uploadUrl.url,
			file: file,
			[field.name]: {
				filename: uploadUrl.filename,
				type: uploadUrl.type,
			},
			deleteUrl,
		}));
		setMediaHasChanged(true);
	};

	const handleFileInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
		if (event.target.files) {
			handleFileUpload(event.target.files[0]);
		}
	};

	const handleOnDelete = async () => {
		const res = await getDeleteUrl({ variables: { key: media.filename } });
		const deleteUrl = res.data.getDeleteUrl;
		if (!deleteUrl) {
			console.error('Delete URL is not available');
			toast.error('Unable to delete file, please try again later.');
			return;
		}
		setValues((prev: any) => ({
			...prev,
			uploadUrl: null,
			file: null,
			[field.name]: null,
			deleteUrl,
		}));
		setMediaHasChanged(true);
	};

	return (
		<div>
			{media ? (
				<>
					<div className={styles.row}>
						<Button type="button" onClick={handleOnDelete}>
							Delete
						</Button>
						<input className={styles.fileInput} type="file" onChange={handleFileInputChange} />
					</div>
					{!mediaHasChanged && media.type === 'IMAGE' ? (
						<img src={media.url} />
					) : (
						!mediaHasChanged && (
							<a href={media.url} target="_blank" rel="noreferrer">
								{media.url}
							</a>
						)
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
