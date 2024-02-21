import { useMutation, useQuery, FetchResult } from '@apollo/client';
import classnames from 'classnames';
import { Field, Form, Formik, FormikHelpers, useFormikContext } from 'formik';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Modal } from '../modal';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { customFields } from 'virtual:graphweaver-user-supplied-custom-fields';

import {
	CustomField,
	decodeSearchParams,
	EntityField,
	queryForEntity,
	routeFor,
	useSchema,
	useSelectedEntity,
} from '../utils';
import { Button } from '../button';
import { Spinner } from '../spinner';
import { generateCreateEntityMutation, generateUpdateEntityMutation } from './graphql';

import styles from './styles.module.css';
import {
	BooleanField,
	EnumField,
	ImageField,
	JSONField,
	SelectField,
	uploadFileToSignedURL,
} from './fields';
import { DetailPanelFieldLabel } from '../detail-panel-field-label';
import { LinkField } from './fields/link-field';
import { isValueEmpty, mapFormikValuesToGqlRequestValues } from './util';
import { MediaField } from './fields/media-field';

interface ResultBaseType {
	id: string;
	[x: string]: unknown;
}

export enum PanelMode {
	CREATE = 'CREATE',
	EDIT = 'EDIT',
}

const getField = ({ field }: { field: EntityField }) => {
	const isReadonly = field.type === 'ID' || field.type === 'ID!' || field.attributes?.isReadOnly;
	if (field.relationshipType) {
		// If the field is readonly and a relationship, show a link to the entity/entities
		if (isReadonly) {
			return <LinkField name={field.name} entity={field} />;
		}
		return <SelectField name={field.name} entity={field} />;
	}

	if (field.type === 'JSON') {
		return <JSONField name={field.name} />;
	}

	if (field.type === 'Boolean') {
		return <BooleanField name={field.name} />;
	}

	if (field.type === 'Image') {
		return <ImageField field={field} />;
	}

	if (field.type === 'Media') {
		return <MediaField field={field} />;
	}

	const { enumByName } = useSchema();
	const enumField = enumByName(field.type);
	if (enumField) {
		return <EnumField name={field.name} typeEnum={enumField} multiple={field.isArray} />;
	}

	const fieldType = field.type === 'Number' ? 'number' : 'text';

	return (
		<Field
			id={field.name}
			name={field.name}
			type={fieldType}
			className={styles.textInputField}
			disabled={isReadonly}
		/>
	);
};

const DetailField = ({ field }: { field: EntityField }) => {
	const isRequired = !(field.type === 'ID' || field.type === 'ID!') && field.attributes?.isRequired;
	const displayName = `${field.name}${isRequired ? '*' : ''}`;

	return (
		<div className={styles.detailField}>
			<DetailPanelFieldLabel fieldName={displayName} />

			{getField({ field })}
		</div>
	);
};

const CustomField = ({
	field,
	entity,
	panelMode,
}: {
	field: CustomField;
	entity: Record<string, any>;
	panelMode: PanelMode;
}) => (
	<div className={styles.detailField}>
		{field.component({ entity, context: 'detail-form', panelMode })}
	</div>
);

const PersistForm = ({ name }: { name: string }) => {
	const { values, isSubmitting, submitForm } = useFormikContext();

	useEffect(() => {
		// Check if we have saved session form state and auto-submit after auth step-up
		const savedSessionState = window.sessionStorage.getItem(name);
		if (savedSessionState && !isSubmitting) submitForm();
	}, []);

	useEffect(() => {
		// As we are about to submit save the session data in case we need it after auth step-up
		if (values && isSubmitting) window.sessionStorage.setItem(name, JSON.stringify(values));
	}, [values, isSubmitting]);

	return null;
};

const DetailForm = ({
	initialValues,
	detailFields,
	onCancel,
	onSubmit,
	persistName,
	isReadOnly,
	panelMode,
}: {
	initialValues: Record<string, any>;
	detailFields: (EntityField | CustomField)[];
	onSubmit: (values: any, actions: FormikHelpers<any>) => void;
	onCancel: () => void;
	persistName: string;
	isReadOnly?: boolean;
	panelMode: PanelMode;
}) => {
	// We need to validate the form for required fields before submitting
	const validate = useCallback(
		(values: any) => {
			const errors: Record<string, string> = {};
			for (const field of detailFields) {
				if (
					field.attributes?.isRequired &&
					field.type !== 'ID' &&
					field.type !== 'ID!' &&
					field.type !== 'custom' &&
					isValueEmpty(values[field.name])
				) {
					errors[field.name] = 'Required';
				}
			}

			const fieldsInError = Object.keys(errors);
			if (fieldsInError.length === 0) return {};

			// TODO EXOGW-150: instead of using toast, we should use a formik error message on the form itself
			toast.error(
				`${fieldsInError.join(', ')} ${fieldsInError.length > 1 ? 'are' : 'is a'} required field${
					fieldsInError.length > 1 ? 's' : ''
				}.`,
				{
					duration: 5000,
				}
			);
			return errors;
		},
		[detailFields]
	);

	return (
		<Formik
			validate={validate}
			validateOnChange={false} // We don't want to validate on change because it will trigger a toast message on every keystroke
			validateOnBlur={false} // We don't want to validate on blur because it will trigger a toast message
			initialValues={initialValues}
			onSubmit={onSubmit}
			onReset={onCancel}
		>
			{({ isSubmitting }) => (
				<Form className={styles.detailFormContainer}>
					<div className={styles.detailFieldList}>
						{detailFields.map((field) => {
							if (field.type === 'custom') {
								if ((field as CustomField).hideOnDetailForm) return null;

								return (
									<CustomField
										key={field.name}
										field={field as CustomField}
										entity={initialValues}
										panelMode={panelMode}
									/>
								);
							} else {
								return <DetailField key={field.name} field={field} />;
							}
						})}
						<div className={styles.detailButtonContainer}>
							<Button type="reset" disabled={isSubmitting}>
								Cancel
							</Button>
							<Button type="submit" disabled={isSubmitting || !!isReadOnly} loading={isSubmitting}>
								Save
							</Button>
						</div>
					</div>
					<PersistForm name={persistName} />
				</Form>
			)}
		</Formik>
	);
};

const SLIDE_ANIMATION_TIME_CSS_VAR_NAME = '--detail-panel-slide-animation-time';

export const DetailPanel = () => {
	const [open, setOpen] = useState(false);
	const [search, setSearchParams] = useSearchParams();

	const modalRedirectUrl = search.get('modalRedirectUrl');

	const { id, entity } = useParams();
	const navigate = useNavigate();
	const { selectedEntity } = useSelectedEntity();
	const { entityByName, entityByType } = useSchema();

	if (!selectedEntity) throw new Error('There should always be a selected entity at this point.');

	const panelMode = id === 'graphweaver-admin-new-entity' ? PanelMode.CREATE : PanelMode.EDIT;

	const { data, loading, error } = useQuery<{ result: ResultBaseType }>(
		queryForEntity(selectedEntity, entityByName),
		{
			variables: { id },
			skip: panelMode === PanelMode.CREATE,
		}
	);

	const onClose = () => {
		const path = window.location.pathname;
		const entityName = selectedEntity.name;

		//@todo - this is a hack, need to figure out how to remove this function when the entity changes.
		// This pattern checks that the entity name exists between two forward slashes
		const regexPattern = new RegExp(`/${entityName}/`);
		// If the path does not include the entity name, then we've already moved to a different entity
		// Navigate to the current path to close the overlay
		if (!regexPattern.test(path)) {
			navigate(path);
			return;
		}

		const { filters, sort } = decodeSearchParams(search);
		navigate(routeFor({ entity: selectedEntity, filters, sort }));
	};

	const customFieldsToShow = (customFields?.get(selectedEntity.name) || []).filter(
		(customField) => {
			const { detailForm: show } = customField.showOn ?? { detailForm: true };
			return show;
		}
	);

	const formFields: EntityField[] = selectedEntity.fields.filter((field) => {
		// We don't show Many to Many relationships in the form yet because we don't have
		// a good editing interface for them.
		if (field.relationshipType === 'MANY_TO_MANY') return false;

		// We also don't show the related ID field for the same reason
		if (field.relationshipType && field.name === 'id') return false;

		// And we want to filter out any fields that will be overridden with custom fields.
		if (customFieldsToShow.find((customField) => customField.name === field.name)) return false;

		// Otherwise we're all good.
		return true;
	});

	// Merge in the custom fields to the existing fields taking into account any supplied index
	for (const field of customFieldsToShow) {
		formFields.splice(field.index ?? formFields.length, 0, field);
	}

	const persistName = `gw-${entity}-${id}`.toLowerCase();
	const savedSessionState = useMemo((): ResultBaseType | undefined => {
		const maybeState = window.sessionStorage.getItem(persistName);
		if (maybeState && maybeState !== null) {
			return JSON.parse(maybeState);
		}
		return undefined;
	}, []);

	const initialValues = formFields.reduce((acc, field) => {
		const result = savedSessionState ?? data?.result;
		const value = result?.[field.name as keyof typeof result];
		acc[field.name] = value ?? field.initialValue ?? undefined;
		return acc;
	}, {} as Record<string, any>);

	const [updateEntity] = useMutation(generateUpdateEntityMutation(selectedEntity, entityByType));
	const [createEntity] = useMutation(generateCreateEntityMutation(selectedEntity, entityByType));

	const slideAnimationTime = useMemo(() => {
		const slideAnimationTimeCssVar = getComputedStyle(document.documentElement)
			.getPropertyValue(SLIDE_ANIMATION_TIME_CSS_VAR_NAME)
			.trim();

		const slideAnimationTime = parseInt(slideAnimationTimeCssVar);
		return isNaN(slideAnimationTime) ? 0 : slideAnimationTime;
	}, []);

	useEffect(() => {
		setTimeout(() => setOpen(true), slideAnimationTime);
	}, []);

	const closeModal = () => {
		clearSessionState();
		setOpen(false);
		setTimeout(onClose, slideAnimationTime);
	};

	const navigateToDetailForEntity = (id?: string) => {
		if (!id) return;
		navigate(routeFor({ entity: selectedEntity, id }));
	};

	const handleOnSubmit = async (formValues: any, actions: FormikHelpers<any>) => {
		// Format form values as GraphQL input parameters
		const values = mapFormikValuesToGqlRequestValues(formValues);

		try {
			let result: FetchResult;
			if (id && panelMode === PanelMode.EDIT) {
				// Update an existing entity
				if (formValues.uploadUrl && formValues.file) {
					await uploadFileToSignedURL(values.uploadUrl, values.file);
					// remove the uploadUrl and file from the values. These are set in the <ImageField> on upload file
					delete values.uploadUrl;
					delete values.file;
					// delete the value where the name is the field that has the image or media type
					delete values[selectedEntity.fields.find((field) => field.type === 'Image')?.name ?? ''];
					delete values[selectedEntity.fields.find((field) => field.type === 'Media')?.name ?? ''];
				}

				// if uploadUrl and downloadUrl are there, remove them because theyre not on SubmissionCreateOrUpdateInput
				if (values.uploadUrl === null) delete values.uploadUrl;
				if (values.downloadUrl === null || values.downloadUrl === '') delete values.downloadUrl;
				if (values.file === null) delete values.file;

				result = await updateEntity({
					variables: {
						data: {
							id,
							...values,
						},
					},
				});
			} else {
				// Create a new entity
				// If the form values contain an image, then do seperate mutation to upload the image
				if (formValues.uploadUrl && formValues.file) {
					await uploadFileToSignedURL(values.uploadUrl, values.file);
					// remove the uploadUrl and file from the formik values
					delete values.uploadUrl;
					delete values.file;
				}
				result = await createEntity({
					variables: {
						data: values,
					},
					refetchQueries: [`AdminUIListPage`],
				});
			}

			if (!result.data) {
				return toast.error('No data received in response', {
					duration: 5000,
				});
			}

			clearSessionState();
			onClose();

			const entityname = `${id && panelMode === PanelMode.EDIT ? 'update' : 'create'}${
				selectedEntity.name
			}`;

			toast.success(
				<div>
					Item{' '}
					<button
						className={styles.link}
						onClick={() => navigateToDetailForEntity(result.data?.[entityname].id)}
					>
						{selectedEntity.summaryField
							? `${result.data?.[entityname].id} ${
									result.data?.[entityname]?.[selectedEntity.summaryField]
							  }`
							: result.data?.[entityname].id}
					</button>{' '}
					has been successfully {id && panelMode === PanelMode.EDIT ? 'updated' : 'created'}.
				</div>
			);
		} catch (error: unknown) {
			toast.error(String(error), {
				duration: 5000,
			});
		} finally {
			actions.setSubmitting(false);
		}
	};

	const clearSessionState = () => {
		window.sessionStorage.removeItem(persistName);
	};

	const handleConfirmLeave = () => {
		if (!modalRedirectUrl) return;

		navigate(modalRedirectUrl, { replace: true });
	};

	const handleCancelLeave = () => {
		// Close the unsaved changes modal via clearing the modalRedirectUrl
		setSearchParams({ modalRedirectUrl: '' });
	};

	return (
		<>
			<Modal
				key={selectedEntity.name}
				isOpen
				onRequestClose={closeModal}
				shouldCloseOnEsc
				shouldCloseOnOverlayClick
				className={
					open ? classnames(styles.detailContainer, styles.slideIn) : styles.detailContainer
				}
				title={selectedEntity.name}
				modalContent={
					<>
						{loading ? (
							<Spinner />
						) : error ? (
							<p>Failed to load entity.</p>
						) : (
							<>
								<DetailForm
									initialValues={initialValues}
									detailFields={formFields}
									onCancel={closeModal}
									onSubmit={handleOnSubmit}
									persistName={persistName}
									isReadOnly={selectedEntity.attributes.isReadOnly}
									panelMode={panelMode}
								/>
							</>
						)}
					</>
				}
			/>
			<Modal
				isOpen={!!modalRedirectUrl}
				hideCloseX
				modalContent={
					<>
						<div className={styles.unsavedChangesTitle}>You have unsaved changes</div>
						<div className={styles.unsavedChangesContent}>
							Are you sure you want to leave this entity? Your changes will not be saved.
						</div>
						<div className={styles.unsavedChangesButtonRow}>
							<Button className={styles.unsavedChangesButton} onClick={handleCancelLeave}>
								Cancel
							</Button>
							<Button className={styles.unsavedChangesButton} onClick={handleConfirmLeave}>
								Discard Changes
							</Button>
						</div>
					</>
				}
				className={styles.unsavedChangesModal}
			/>
		</>
	);
};
