import { ApolloError, useMutation, useQuery } from '@apollo/client';
import classnames from 'classnames';
import { Field, Form, Formik, FormikHelpers, useField, useFormikContext } from 'formik';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Modal } from '../modal';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';

import {
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
import { Select, SelectMode, SelectOption } from '../multi-select';
import {
	generateCreateEntityMutation,
	generateUpdateEntityMutation,
	getRelationshipQuery,
} from './graphql';

import styles from './styles.module.css';

interface ResultBaseType {
	id: string;
	[x: string]: unknown;
}

const SelectField = ({ name, entity }: { name: string; entity: EntityField }) => {
	const [_, meta, helpers] = useField({ name, multiple: false });
	const { entityByType } = useSchema();
	const { initialValue } = meta;
	const relationshipEntityType = entityByType(entity.type);

	useEffect(() => {
		helpers.setValue(initialValue);
	}, []);

	const { data } = useQuery<{ result: Record<string, string>[] }>(
		getRelationshipQuery(entity.type, relationshipEntityType.summaryField),
		{
			variables: {
				pagination: {
					orderBy: {
						[relationshipEntityType.summaryField as string]: 'ASC',
					},
				},
			},
		}
	);

	const options = (data?.result ?? []).map<SelectOption>((item): SelectOption => {
		const label = relationshipEntityType.summaryField;
		return { label: label ? item[label] : 'notfound', value: item.id };
	});

	const handleOnChange = (selected: SelectOption[]) => {
		helpers.setValue(selected?.[0]);
	};

	return (
		<Select
			options={options}
			value={initialValue ? [initialValue] : []}
			onChange={handleOnChange}
			mode={SelectMode.SINGLE}
		/>
	);
};

const BooleanField = ({ name }: { name: string }) => {
	const [_, meta, helpers] = useField({ name, multiple: false });
	const { initialValue } = meta;

	useEffect(() => {
		helpers.setValue(initialValue);
	}, []);

	const handleOnChange = (selected: SelectOption[]) => {
		const value = selected?.[0]?.value;
		if (value === undefined) {
			helpers.setValue(undefined);
		} else {
			helpers.setValue(value);
		}
	};

	return (
		<Select
			options={[
				{ value: true, label: 'true' },
				{ value: false, label: 'false' },
			]}
			value={initialValue === undefined ? [] : [{ value: initialValue, label: `${initialValue}` }]}
			onChange={handleOnChange}
			mode={SelectMode.SINGLE}
		/>
	);
};

const JSONField = ({ name }: { name: string }) => {
	const [_, meta] = useField({ name, multiple: false });
	const { initialValue } = meta;
	return <code>{JSON.stringify(initialValue, null, 4)}</code>;
};

const DetailField = ({ field }: { field: EntityField }) => {
	return (
		<div className={styles.detailField}>
			<label htmlFor={field.name} className={styles.fieldLabel}>
				{field.name}
			</label>
			{field.relationshipType ? (
				<SelectField name={field.name} entity={field} />
			) : field.type === EntityFieldType.JSON ? (
				<JSONField name={field.name} />
			) : field.type === EntityFieldType.BOOLEAN ? (
				<BooleanField name={field.name} />
			) : (
				<Field id={field.name} name={field.name} className={styles.textInputField} />
			)}
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
}: {
	initialValues: Record<string, any>;
	detailFields: EntityField[];
	onSubmit: (values: any, actions: FormikHelpers<any>) => void;
	onCancel: () => void;
	persistName: string;
}) => {
	return (
		<Formik initialValues={initialValues} onSubmit={onSubmit} onReset={onCancel}>
			{({ isSubmitting }) => (
				<Form className={styles.detailFormContainer}>
					<div className={styles.detailFieldList}>
						{detailFields.map((field) => {
							return <DetailField key={field.name} field={field} />;
						})}
						<div className={styles.detailButtonContainer}>
							<Button type="reset" disabled={isSubmitting}>
								Cancel
							</Button>
							<Button type="submit" disabled={isSubmitting} loading={isSubmitting}>
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

	const { data, loading, error } = useQuery<{ result: ResultBaseType }>(
		queryForEntity(selectedEntity, entityByName),
		{
			variables: { id },
			skip: id === 'graphweaver-admin-new-entity',
		}
	);

	const onClose = useCallback(() => {
		const { filters, sort } = decodeSearchParams(search);
		navigate(routeFor({ entity: selectedEntity, filters, sort }));
	}, [search, selectedEntity]);

	// Weed out ID fields - for the moment.
	// @todo we can remove the many to many filter once we support adding many to many in the UI
	const formFields: EntityField[] = selectedEntity.fields.filter(
		(field) =>
			(field.relationshipType && field.relationshipType !== 'MANY_TO_MANY') ||
			(!field.relationshipType && field.name !== 'id')
	);

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
		acc[field.name] = value ?? '';
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

		if (id && id !== 'graphweaver-admin-new-entity') {
			await updateEntity({
				variables: {
					data: {
						id,
						...values,
					},
				},
			});
		} else {
			await createEntity({
				variables: {
					data: values,
				},
			});
		}

		actions.setSubmitting(false);
		clearSessionState();
		onClose();
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
						/>
					)}
				</>
			}
		/>
	);
};
