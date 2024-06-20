import { useState } from 'react';
import { useField, useFormikContext } from 'formik';
import { useMutation } from '@apollo/client';

import { EntityField } from '../../../utils';
import { getDeleteUrlMutation, getUploadUrlMutation } from '../../graphql';
import { Button } from '../../../button';
import { useAutoFocus } from '../../../hooks';

import styles from './styles.module.css';
import toast from 'react-hot-toast';
import { useRegisterDataTransform } from '../../use-data-transform';

const internalKey = Symbol('media-field-internal');

interface WorkingMediaFieldValue {
	[internalKey]:
		| {
				uploadUrl?: string;
				deleteUrl?: string;
				file?: File;
		  }
		| undefined;
}

const deleteFileToSignedURL = async (deleteURL: string) => {
	const response = await fetch(deleteURL, {
		method: 'DELETE',
	});

	if (response.ok) {
		return true;
	} else {
		throw new Error(`Error deleting file: ${response?.statusText}`);
	}
};

const uploadFileToSignedURL = async (uploadURL: string, file: any) => {
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
	const { setFieldValue } = useFormikContext();
	const [mediaHasChanged, setMediaHasChanged] = useState(false);
	const [_, meta] = useField({ name: field.name, multiple: false });
	const { initialValue: media } = meta;
	const [getUploadUrl] = useMutation(getUploadUrlMutation);
	const [getDeleteUrl] = useMutation(getDeleteUrlMutation);
	const inputRef = useAutoFocus<HTMLInputElement>(autoFocus);

	useRegisterDataTransform({
		field,
		transform: async (value: unknown) => {
			if (!value) return undefined;

			// We may have some pending operations we need to do before the mutation goes up to the server.
			const workingValue = value as WorkingMediaFieldValue;
			const { deleteUrl, uploadUrl, file } = workingValue[internalKey] ?? {};

			// If there's a file to delete, let's do it.
			if (deleteUrl) {
				await deleteFileToSignedURL(deleteUrl);
			}

			// If there's a file to upload, let's do that too.
			if (uploadUrl && file) {
				await uploadFileToSignedURL(uploadUrl, file);
			}
			// Ok, now we just need to give the correct shape to the server, which is:
			// { filename: string, type: string } and nothing else.
			const { filename, type } = (value as any) ?? {};
			if (filename && type) return { filename, type };

			// Ok, then whatever this is, it's not a set file.
			return undefined;
		},
	});

	const handleFileUpload = async (file: File) => {
		// Where do we upload the new file to?
		const res = await getUploadUrl({ variables: { key: file.name } });
		const uploadUrl = res.data.getUploadUrl;
		if (!uploadUrl) {
			console.error('Upload URL is not available');
			toast.error('Unable to upload file, please try again later.');
			return;
		}

		// If there's an existing file, we need to delete it from S3 first to clean up what we had before.
		let deleteUrl = null;
		if (media) {
			const deleteRes = await getDeleteUrl({ variables: { key: media.filename } });
			deleteUrl = deleteRes.data.getDeleteUrl;
			if (!deleteUrl) {
				console.error('Delete URL is not available');
				toast.error('Unable to get delete URL, please try again later.');
				return;
			}
		}

		// Alrighty, let's remember this for the future.
		setFieldValue(field.name, {
			filename: uploadUrl.filename,
			type: uploadUrl.type,
			[internalKey]: {
				uploadUrl: uploadUrl.url,
				file,
				deleteUrl,
			},
		});

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

		setFieldValue(field.name, null);
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
