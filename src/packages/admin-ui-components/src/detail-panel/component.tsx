import { useMutation, useQuery, FetchResult } from '@apollo/client';
import classnames from 'classnames';
import { Field, Form, Formik, FormikHelpers, useFormikContext } from 'formik';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Modal } from '../modal';
import { Link, useLocation, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { customFields } from 'virtual:graphweaver-user-supplied-custom-fields';

import {
	CustomField,
	decodeSearchParams,
	Entity,
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
import { mapFormikValuesToGqlRequestValues } from './util';
import { MediaField } from './fields/media-field';

interface ResultBaseType {
	id: string;
	[x: string]: unknown;
}
// click link
// puhs redirect url from link component "confrimRedirectUrl=title"
// modall will watvh watch for redirct url variale
// cance

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
		return <EnumField name={field.name} typeEnum={enumField} />;
	}

	return (
		<Field
			id={field.name}
			name={field.name}
			className={styles.textInputField}
			disabled={isReadonly}
		/>
	);
};

const DetailField = ({ field }: { field: EntityField }) => {
	return (
		<div className={styles.detailField}>
			<DetailPanelFieldLabel fieldName={field.name} />

			{getField({ field })}
		</div>
	);
};

const CustomField = ({ field, entity }: { field: CustomField; entity: Record<string, any> }) => (
	<div className={styles.detailField}>{field.component({ entity, context: 'detail-form' })}</div>
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
}: {
	initialValues: Record<string, any>;
	detailFields: (EntityField | CustomField)[];
	onSubmit: (values: any, actions: FormikHelpers<any>) => void;
	onCancel: () => void;
	persistName: string;
	isReadOnly?: boolean;
}) => {
	return (
		<Formik initialValues={initialValues} onSubmit={onSubmit} onReset={onCancel}>
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

	const isNew = id === 'graphweaver-admin-new-entity';

	const { data, loading, error } = useQuery<{ result: ResultBaseType }>(
		queryForEntity(selectedEntity, entityByName),
		{
			variables: { id },
			skip: isNew,
		}
	);

	const onClose = () => {
		const path = window.location.pathname;
		// If the path does not include the entity name, then we've already moved to a different entity
		// Navigate to that path to close the overlay
		if (!path.includes(selectedEntity.name)) {
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
		acc[field.name] = value ?? undefined;
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
			if (id && !isNew) {
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
				});
			}

			if (!result.data) {
				return toast.error('No data received in response', {
					duration: 5000,
				});
			}

			clearSessionState();
			onClose();

			const entityname = `${id && !isNew ? 'update' : 'create'}${selectedEntity.name}`;

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
					has been successfully {id && !isNew ? 'updated' : 'created'}.
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

	// Callback to be called when the user confirms leaving the page
	const handleConfirmLeave = () => {
		if (!modalRedirectUrl) return;
		// @todo
		// if the modalRedirectUrl is local, then navigate to it
		// if it's not local open it in a new tab

		navigate(modalRedirectUrl, { replace: true });
	};
	// Callback to be called when the user cancels leaving the page
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
								/>
							</>
						)}
					</>
				}
			/>
			<Modal
				isOpen={!!modalRedirectUrl}
				title="You have unsaved changes"
				modalContent={
					<div>Are you sure you want to leave this entity? Your changes will not be saved.</div>
				}
				footerContent={
					<>
						<button onClick={handleCancelLeave}>Cancel</button>
						<button onClick={handleConfirmLeave}>Discard Changes</button>
					</>
				}
			/>
		</>
	);
};
