import { FetchResult, useMutation, useQuery } from '@apollo/client';
import clsx from 'clsx';
import { Form, Formik, FormikHelpers, useField, useFormikContext } from 'formik';
import { useCallback, useEffect, useMemo, useState } from 'react';
import isEqual from 'react-fast-compare';
import toast from 'react-hot-toast';
import { customFields as authCustomFields } from 'virtual:graphweaver-auth-ui-components';
import { customFields } from 'virtual:graphweaver-user-supplied-custom-fields';
import { useLocation, useParams, useSearchParams } from 'wouter';
import { Button } from '../button';
import { DetailPanelFieldLabel } from '../detail-panel-field-label';
import { getEntityListQueryName } from '../entity-list/graphql';
import { Modal } from '../modal';
import { Spinner } from '../spinner';
import {
	AdminUIFilterType,
	CustomField,
	decodeSearchParams,
	DetailPanelInputComponentOption,
	Entity,
	EntityField,
	queryForEntity,
	routeFor,
	useSchema,
	useSelectedEntity,
} from '../utils';
import {
	BooleanField,
	DateField,
	EnumField,
	JSONField,
	LinkField,
	MediaField,
	RelationshipField,
	RichTextField,
	TextField,
} from './fields';
import { generateCreateEntityMutation, generateUpdateEntityMutation } from './graphql';
import styles from './styles.module.css';
import { dataTransforms } from './use-data-transform';
import { isValueEmpty, parseValueForForm, transformValueForForm } from './util';

interface ResultBaseType {
	id: string;
	[x: string]: unknown;
}

export enum PanelMode {
	CREATE = 'CREATE',
	EDIT = 'EDIT',
}

const isFieldReadonly = (
	panelMode: PanelMode,
	entity: Entity,
	field: EntityField | CustomField<unknown>
) => {
	// Regardless of if we're creating or editing, IDs should always be read only
	// unless the entity has client generated primary keys.
	if (
		(field.type === 'ID' || field.type === 'ID!') &&
		!entity.attributes.clientGeneratedPrimaryKeys
	) {
		return true;
	}

	// If the entity as a whole is read only, then all fields should be read only.
	if (entity.attributes.isReadOnly) return true;

	// If we're editing and a field is read only, it should be shown as read only.
	// However if we're creating, we may need to write the value for the initial creation.
	if (panelMode !== PanelMode.CREATE && field.attributes?.isReadOnly) return true;

	return false;
};

/**
 * Filter out fields before submission. Don't include read only fields. Include fields that are required, or have been modified.
 * 
 * @param initialValues - The initial values of the form.
 * @param values - The current values of the form.
 * @param entity - The entity of the current form
 */
const filterFieldsForSubmission = (initialValues: Record<string, any>, values: Record<string, any>, entity: Entity, panelMode: PanelMode) => {
	const result: Record<string, any> = {};

	for (const [key, value] of Object.entries(values)) {
		const field = entity.fields.find((f) => f.name === key);
		const isRequired = panelMode === PanelMode.CREATE ? field?.attributes?.isRequiredForCreate : field?.attributes?.isRequiredForUpdate;

		if (!isEqual(initialValues[key], value) || isRequired) {
			result[key] = value;
		}
	}

	return result;
};

const getField = ({
	entity,
	field,
	autoFocus,
	panelMode,
}: {
	entity: Entity;
	field: EntityField;
	autoFocus: boolean;
	panelMode: PanelMode;
}) => {
	// In Create mode, all readonly fields should be writeable except ID fields
	const isReadonly = isFieldReadonly(panelMode, entity, field);

	if (field.type === 'JSON') {
		return <JSONField name={field.name} autoFocus={autoFocus} disabled={isReadonly} />;
	}

	if (field.type === 'Boolean') {
		return <BooleanField field={field} autoFocus={autoFocus} disabled={isReadonly} />;
	}

	if (field.type === 'Date' || field.type === 'DateScalar') {
		return (
			<DateField
				field={field}
				filterType={
					field.type === 'DateScalar'
						? AdminUIFilterType.DATE_RANGE
						: AdminUIFilterType.DATE_TIME_RANGE
				}
				fieldType={field.type}
			/>
		);
	}

	if (field.type === 'GraphweaverMedia') {
		return <MediaField field={field} autoFocus={autoFocus} />;
	}

	if (field.relationshipType) {
		// If the field is readonly and a relationship, show a link to the entity/entities
		if (isReadonly) {
			return <LinkField name={field.name} field={field} />;
		} else {
			return <RelationshipField name={field.name} field={field} autoFocus={autoFocus} />;
		}
	}

	const { enumByName } = useSchema();
	const enumObject = enumByName(field.type);
	if (enumObject) {
		return (
			<EnumField
				name={field.name}
				typeEnum={enumObject}
				multiple={field.isArray}
				autoFocus={autoFocus}
				disabled={isReadonly}
			/>
		);
	}

	if (
		field.detailPanelInputComponent?.name === DetailPanelInputComponentOption.RICH_TEXT ||
		field.detailPanelInputComponent?.name === DetailPanelInputComponentOption.MARKDOWN
	) {
		return (
			<RichTextField
				key={field.name}
				field={field}
				isReadOnly={!!isReadonly}
				options={field.detailPanelInputComponent?.options ?? {}}
				asMarkdown={
					field.detailPanelInputComponent?.name === DetailPanelInputComponentOption.MARKDOWN
				}
			/>
		);
	}

	const fieldType = field.type === 'Number' ? 'number' : 'text';

	return (
		<TextField name={field.name} type={fieldType} disabled={isReadonly} autoFocus={autoFocus} />
	);
};

const DetailField = ({
	entity,
	field,
	autoFocus,
	panelMode,
}: {
	entity: Entity;
	field: EntityField;
	autoFocus: boolean;
	panelMode: PanelMode;
}) => {
	const isRequired = panelMode === PanelMode.CREATE ? field.attributes?.isRequiredForCreate : field.attributes?.isRequiredForUpdate;
	return (
		<div className={styles.detailField} data-testid={`detail-panel-field-${field.name}`}>
			<DetailPanelFieldLabel fieldName={field.name} required={isRequired} />

			{getField({ entity, field, autoFocus, panelMode })}
		</div>
	);
};

const CustomFieldComponent = ({
	field,
	entity,
	panelMode,
}: {
	field: CustomField;
	entity: Record<string, any>;
	panelMode: PanelMode;
}) => {
	const [_, meta, helpers] = useField(field.name);
	const formik = {
		meta,
		helpers,
	}

	return (
		<div className={styles.detailField} data-testid={`detail-panel-field-${field.name}`}>
			{field.component({ entity, context: 'detail-form', panelMode, formik, })}
		</div>
	)
};

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
	entity,
	detailFields,
	onCancel,
	onSubmit,
	persistName,
	isReadOnly,
	panelMode,
}: {
	initialValues: Record<string, any>;
	entity: Entity;
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
				const isRequired = panelMode === PanelMode.CREATE ? field.attributes?.isRequiredForCreate : field.attributes?.isRequiredForUpdate;
				if (
					isRequired &&
					field.type !== 'ID' &&
					field.type !== 'ID!' &&
					field.type !== 'custom' &&
					isValueEmpty(values[field.name])
				) {
					errors[field.name] = 'Field is Required';
				}

				if (field.type === 'JSON' && values[field.name]) {
					// Let's ensure we can parse the JSON.
					try {
						JSON.parse(values[field.name]);
					} catch (error) {
						console.error(error);
						errors[field.name] = 'Invalid JSON';
					}
				}
			}

			const groupedByError: Record<string, string[]> = {};
			for (const [field, error] of Object.entries(errors)) {
				if (!groupedByError[error]) groupedByError[error] = [];
				groupedByError[error].push(field);
			}
			const message = Object.entries(groupedByError)
				.map(([error, fields]) => `Error ${error}: ${fields.join(', ')}`)
				.join('\n');

			// TODO EXOGW-150: instead of using toast, we should use a formik error message on the form itself
			if (message) toast.error(message, { duration: 5000 });

			return errors;
		},
		[detailFields]
	);

	// Form fields can modify the data that's saved in form data before it goes up to
	// get submitted. This allows them to work in whatever format is easiest for them
	// but be in control of exactly what gets sent to the server.
	const submit = useCallback(
		async (values: any, actions: FormikHelpers<any>) => {
			try {
				const transformedValues = filterFieldsForSubmission(initialValues, values, entity, panelMode);

				for (const transform of Object.values(dataTransforms)) {
					transformedValues[transform.field.name] = await transform.transform(
						transformedValues[transform.field.name]
					);
				}

				await onSubmit(transformedValues, actions);
			} catch (error: any) {
				console.error(error);
				toast.error(error.message);
			}
		},
		[dataTransforms]
	);

	const firstEditableField = detailFields.find(
		(field) => !isFieldReadonly(panelMode, entity, field)
	);

	return (
		<Formik
			validate={validate}
			validateOnChange={false} // We don't want to validate on change because it will trigger a toast message on every keystroke
			validateOnBlur={false} // We don't want to validate on blur because it will trigger a toast message
			initialValues={initialValues}
			onSubmit={submit}
			onReset={onCancel}
		>
			{({ isSubmitting }) => { 
				return (
				<Form className={styles.detailFormContainer}>
					<div className={styles.detailFieldList}>
						{detailFields.map((field) => {
							if (field.hideInDetailForm) return null;
							else if (field.type === 'custom') {
								return (
									<CustomFieldComponent
										key={field.name}
										field={field as CustomField}
										entity={initialValues}
										panelMode={panelMode}
									/>
								);
							} else {
								return (
									<DetailField
										key={field.name}
										entity={entity}
										field={field}
										autoFocus={field === firstEditableField}
										panelMode={panelMode}
									/>
								);
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
			)}}
		</Formik>
	);
};

const SLIDE_ANIMATION_TIME_CSS_VAR_NAME = '--detail-panel-slide-animation-time';

export const DetailPanel = () => {
	const [open, setOpen] = useState(false);
	const [search, setSearchParams] = useSearchParams();

	const modalRedirectUrl = search.get('modalRedirectUrl');

	const { id, entity } = useParams();
	const [, setLocation] = useLocation();
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
			setLocation(path);
			return;
		}

		const { filters, sort } = decodeSearchParams(search);
		setLocation(routeFor({ entity: selectedEntity, filters, sort }));
	};

	const customFieldsToShow =
		customFields?.get(selectedEntity.name) || authCustomFields?.get(selectedEntity.name) || [];

	const formFields: EntityField[] = selectedEntity.fields.filter((field) => {
		// Don't expose control of the primary key field
		if (field.relationshipType && field.name === selectedEntity.primaryKeyField) return false;

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

	const initialValues = formFields.reduce(
		(acc, field) => {
			const result = savedSessionState ?? data?.result;
			const value = parseValueForForm(field.type, result?.[field.name as keyof typeof result]);
			const transformedValue = transformValueForForm(field, value, entityByType);
			acc[field.name] = transformedValue ?? field.initialValue ?? undefined;
			return acc;
		},
		{} as Record<string, any>
	);

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
		setLocation(routeFor({ entity: selectedEntity, id }));
	};

	const handleOnSubmit = async (values: any, actions: FormikHelpers<any>) => {
		try {
			let result: FetchResult | undefined = undefined;

			try {
				const options = {
					variables: {
						input: values,
					},
					refetchQueries: [getEntityListQueryName(selectedEntity)],
				};

				result =
					panelMode === PanelMode.EDIT ? await updateEntity(options) : await createEntity(options);
			} catch (error: any) {
				console.error(error);
				return toast.error(`Error from server: ${error.message}`, { duration: 5000 });
			}

			if (!result?.data) {
				return toast.error('No data received in response', { duration: 5000 });
			}

			clearSessionState();
			onClose();

			const entityname = `${panelMode === PanelMode.EDIT ? 'update' : 'create'}${
				selectedEntity.name
			}`;

			toast.success(
				<div>
					Item{' '}
					<button
						className={styles.link}
						onClick={() =>
							navigateToDetailForEntity(result.data?.[entityname][selectedEntity.primaryKeyField])
						}
					>
						{selectedEntity.summaryField
							? `${result.data?.[entityname][selectedEntity.primaryKeyField]} ${
									result.data?.[entityname]?.[selectedEntity.summaryField]
								}`
							: result.data?.[entityname][selectedEntity.primaryKeyField]}
					</button>{' '}
					has been successfully {panelMode === PanelMode.EDIT ? 'updated' : 'created'}.
				</div>,
				{ duration: 10_000 }
			);
		} catch (error: unknown) {
			console.error(error);
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

		setLocation(modalRedirectUrl, { replace: true });
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
				className={open ? clsx(styles.detailContainer, styles.slideIn) : styles.detailContainer}
				title={selectedEntity.name}
				modalContent={
					<>
						{loading ? (
							<Spinner />
						) : error || data?.result === null ? (
							<p>Failed to load entity.</p>
						) : (
							<DetailForm
								initialValues={initialValues}
								detailFields={formFields}
								entity={selectedEntity}
								onCancel={closeModal}
								onSubmit={handleOnSubmit}
								persistName={persistName}
								isReadOnly={selectedEntity.attributes.isReadOnly}
								panelMode={panelMode}
							/>
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
