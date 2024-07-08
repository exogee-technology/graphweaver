import { useMutation, useQuery, FetchResult } from '@apollo/client';
import clsx from 'clsx';
import { Form, Formik, FormikHelpers, useFormikContext } from 'formik';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';

import { customFields } from 'virtual:graphweaver-user-supplied-custom-fields';
import { Modal } from '../modal';

import {
	CustomField,
	decodeSearchParams,
	EntityField,
	federationNameForEntity,
	queryForEntity,
	routeFor,
	useSchema,
	useSelectedEntity,
} from '../utils';
import { Button } from '../button';
import { Spinner } from '../spinner';
import { generateCreateEntityMutation, generateUpdateEntityMutation } from './graphql';
import {
	BooleanField,
	EnumField,
	JSONField,
	RelationshipField,
	LinkField,
	MediaField,
	TextField,
} from './fields';
import { DetailPanelFieldLabel } from '../detail-panel-field-label';

import { dataTransforms } from './use-data-transform';
import { isValueEmpty } from './util';
import styles from './styles.module.css';

interface ResultBaseType {
	id: string;
	[x: string]: unknown;
}

export enum PanelMode {
	CREATE = 'CREATE',
	EDIT = 'EDIT',
}

const isFieldReadonly = (field: EntityField | CustomField<unknown>) =>
	field.type === 'ID' || field.type === 'ID!' || field.attributes?.isReadOnly;

const getField = ({
	field,
	autoFocus,
	federationSubgraphName,
}: {
	field: EntityField;
	autoFocus: boolean;
	federationSubgraphName?: string;
}) => {
	const isReadonly = isFieldReadonly(field);

	if (field.relationshipType) {
		// If the field is readonly and a relationship, show a link to the entity/entities
		if (isReadonly) {
			return <LinkField name={field.name} field={field} />;
		}
		return <RelationshipField name={field.name} field={field} autoFocus={autoFocus} />;
	}

	if (field.type === 'JSON') {
		return <JSONField name={field.name} autoFocus={autoFocus} />;
	}

	if (field.type === 'Boolean') {
		return <BooleanField name={field.name} autoFocus={autoFocus} />;
	}

	if (field.type === federationNameForEntity('Media', federationSubgraphName)) {
		return <MediaField field={field} autoFocus={autoFocus} />;
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
			/>
		);
	}

	const fieldType = field.type === 'Number' ? 'number' : 'text';

	return (
		<TextField name={field.name} type={fieldType} disabled={isReadonly} autoFocus={autoFocus} />
	);
};

const DetailField = ({
	field,
	autoFocus,
	federationSubgraphName,
}: {
	field: EntityField;
	autoFocus: boolean;
	federationSubgraphName?: string;
}) => {
	const isRequired = !(field.type === 'ID' || field.type === 'ID!') && field.attributes?.isRequired;
	return (
		<div className={styles.detailField}>
			<DetailPanelFieldLabel fieldName={field.name} required={isRequired} />

			{getField({ field, autoFocus, federationSubgraphName })}
		</div>
	);
};

const CustomFieldComponent = ({
	field,
	entity,
	panelMode,
	federationSubgraphName,
}: {
	field: CustomField;
	entity: Record<string, any>;
	panelMode: PanelMode;
	federationSubgraphName?: string;
}) => (
	<div className={styles.detailField}>
		{field.component({ entity, context: 'detail-form', panelMode, federationSubgraphName })}
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
	federationSubgraphName,
	isReadOnly,
	panelMode,
}: {
	initialValues: Record<string, any>;
	detailFields: (EntityField | CustomField)[];
	onSubmit: (values: any, actions: FormikHelpers<any>) => void;
	onCancel: () => void;
	persistName: string;
	federationSubgraphName?: string;
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

	// Form fields can modify the data that's saved in form data before it goes up to
	// get submitted. This allows them to work in whatever format is easiest for them
	// but be in control of exactly what gets sent to the server.
	const submit = useCallback(
		async (values: any, actions: FormikHelpers<any>) => {
			try {
				const transformedValues = values;

				for (const transform of Object.values(dataTransforms)) {
					transformedValues[transform.field.name] = await transform.transform(
						values[transform.field.name]
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

	const firstEditableField = detailFields.find((field) => !isFieldReadonly(field));

	return (
		<Formik
			validate={validate}
			validateOnChange={false} // We don't want to validate on change because it will trigger a toast message on every keystroke
			validateOnBlur={false} // We don't want to validate on blur because it will trigger a toast message
			initialValues={initialValues}
			onSubmit={submit}
			onReset={onCancel}
		>
			{({ isSubmitting }) => (
				<Form className={styles.detailFormContainer}>
					<div className={styles.detailFieldList}>
						{detailFields.map((field) => {
							if (field.type === 'custom') {
								if (field.hideInDetailForm) return null;

								return (
									<CustomFieldComponent
										key={field.name}
										field={field as CustomField}
										entity={initialValues}
										panelMode={panelMode}
										federationSubgraphName={federationSubgraphName}
									/>
								);
							} else {
								return (
									<DetailField
										key={field.name}
										field={field}
										autoFocus={field === firstEditableField}
										federationSubgraphName={federationSubgraphName}
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
	const { entityByName, entityByType, federationSubgraphName } = useSchema();

	if (!selectedEntity) throw new Error('There should always be a selected entity at this point.');

	const panelMode = id === 'graphweaver-admin-new-entity' ? PanelMode.CREATE : PanelMode.EDIT;

	const { data, loading, error } = useQuery<{ result: ResultBaseType }>(
		queryForEntity(selectedEntity, entityByName, federationSubgraphName),
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

	const customFieldsToShow = customFields?.get(selectedEntity.name) || [];

	const formFields: EntityField[] = selectedEntity.fields.filter((field) => {
		// We don't show Many to Many relationships in the form yet because we don't have
		// a good editing interface for them.
		if (field.relationshipType === 'MANY_TO_MANY') return false;

		// We also don't show the related ID field for the same reason
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
			const value = result?.[field.name as keyof typeof result];
			acc[field.name] = value ?? field.initialValue ?? undefined;
			return acc;
		},
		{} as Record<string, any>
	);

	const [updateEntity] = useMutation(
		generateUpdateEntityMutation(selectedEntity, entityByType, federationSubgraphName)
	);
	const [createEntity] = useMutation(
		generateCreateEntityMutation(selectedEntity, entityByType, federationSubgraphName)
	);

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

	const handleOnSubmit = async (values: any, actions: FormikHelpers<any>) => {
		try {
			let result: FetchResult;

			if (panelMode === PanelMode.EDIT) {
				// Update an existing entity
				result = await updateEntity({
					variables: {
						input: values,
					},
				});
			} else {
				// Create a new entity
				result = await createEntity({
					variables: {
						input: values,
					},
					refetchQueries: [`${selectedEntity.plural}List`],
				});
			}

			if (!result.data) {
				return toast.error('No data received in response', {
					duration: 5000,
				});
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
								onCancel={closeModal}
								onSubmit={handleOnSubmit}
								persistName={persistName}
								isReadOnly={selectedEntity.attributes.isReadOnly}
								panelMode={panelMode}
								federationSubgraphName={federationSubgraphName}
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
