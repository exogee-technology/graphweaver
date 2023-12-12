import { useMutation, useQuery, FetchResult } from '@apollo/client';
import classnames from 'classnames';
import { Field, Form, Formik, FormikHelpers, useField, useFormikContext } from 'formik';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Modal } from '../modal';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { customFields } from 'virtual:graphweaver-user-supplied-custom-fields';

import {
	CustomField,
	decodeSearchParams,
	EntityField,
	EntityFieldType,
	queryForEntity,
	routeFor,
	useSchema,
	useSelectedEntity,
} from '../utils';
import { Button } from '../button';
import { Spinner } from '../spinner';
import { generateCreateEntityMutation, generateUpdateEntityMutation } from './graphql';

import styles from './styles.module.css';
import { BooleanField, EnumField, JSONField, SelectField } from './fields';

interface ResultBaseType {
	id: string;
	[x: string]: unknown;
}

const getField = ({ field }: { field: EntityField }) => {
	if (field.relationshipType) {
		return <SelectField name={field.name} entity={field} />;
	}

	if (field.type === 'JSON') {
		return <JSONField name={field.name} />;
	}

	if (field.type === 'Boolean') {
		return <BooleanField name={field.name} />;
	}

	const { enumByName } = useSchema();
	const enumField = enumByName(field.type);
	if (enumField) {
		return <EnumField name={field.name} typeEnum={enumField} />;
	}

	return <Field id={field.name} name={field.name} className={styles.textInputField} />;
};

const DetailField = ({ field }: { field: EntityField }) => {
	return (
		<div className={styles.detailField}>
			<label htmlFor={field.name} className={styles.fieldLabel}>
				{field.name}
			</label>
			{getField({ field })}
		</div>
	);
};

const CustomField = ({ field }: { field: CustomField }) => {
	const { selectedEntity } = useSelectedEntity();
	if (!selectedEntity) throw new Error('There should always be a selected entity at this point.');

	return (
		<div className={styles.detailField}>
			{field.component({ entity: selectedEntity, context: 'detail-form' })}
		</div>
	);
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
								const { detailForm: show } = (field as CustomField).showOn ?? { detailForm: true };

								return show ? <CustomField key={field.name} field={field as CustomField} /> : null;
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

	const { id, entity } = useParams();
	const navigate = useNavigate();
	const { selectedEntity } = useSelectedEntity();
	const { entityByName, entityByType } = useSchema();
	const [search] = useSearchParams();

	if (!selectedEntity) throw new Error('There should always be a selected entity at this point.');

	const isNew = id === 'graphweaver-admin-new-entity';

	const { data, loading, error } = useQuery<{ result: ResultBaseType }>(
		queryForEntity(selectedEntity, entityByName),
		{
			variables: { id },
			skip: isNew,
		}
	);

	const onClose = useCallback(() => {
		const { filters, sort } = decodeSearchParams(search);
		navigate(routeFor({ entity: selectedEntity, filters, sort }));
	}, [search, selectedEntity]);

	// Weed out ID fields - for the moment.
	// @todo we can remove the many to many filter once we support adding many to many in the UI
	// remove field if it is readonly
	const formFields: EntityField[] = selectedEntity.fields.filter(
		(field) =>
			(field.relationshipType && field.relationshipType !== 'MANY_TO_MANY') ||
			(!field.relationshipType && field.name !== 'id' && !field.attributes?.isReadOnly)
	);

	// Merge any custom fields in at their appropriate indices.
	// Let's check if there are custom fields to add
	const customFieldsForEntity = customFields?.get(selectedEntity.name);
	if (customFieldsForEntity) {
		// Add the custom fields to the existing fields taking into account any supplied index
		for (const field of customFieldsForEntity) {
			formFields.splice(field.index ?? formFields.length, 0, field);
		}
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
		const values = (Object.entries(formValues) ?? []).reduce((acc, [key, value]: [string, any]) => {
			// Check if we have a relationship value if so let's only send the id to the server
			acc[key] =
				value && typeof value === 'object' && value.hasOwnProperty('value')
					? { id: value.value }
					: value;

			return acc;
		}, {} as Record<string, any>);

		try {
			let result: FetchResult;
			if (id && !isNew) {
				result = await updateEntity({
					variables: {
						data: {
							id,
							...values,
						},
					},
				});
			} else {
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

	return (
		<Modal
			isOpen
			onRequestClose={closeModal}
			shouldCloseOnEsc
			shouldCloseOnOverlayClick
			className={open ? classnames(styles.detailContainer, styles.slideIn) : styles.detailContainer}
			title={selectedEntity.name}
			modalContent={
				<>
					{loading ? (
						<Spinner />
					) : error ? (
						<p>Failed to load entity.</p>
					) : (
						<DetailForm
							initialValues={initialValues}
							detailFields={formFields}
							onCancel={closeModal}
							onSubmit={handleOnSubmit}
							persistName={persistName}
							isReadOnly={selectedEntity.attributes.isReadOnly}
						/>
					)}
				</>
			}
		/>
	);
};
