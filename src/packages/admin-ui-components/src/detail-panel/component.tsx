import { ApolloQueryResult, useMutation, useQuery } from '@apollo/client';
import classnames from 'classnames';
import { Field, Form, Formik, FormikHelpers, useField } from 'formik';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Modal } from '../modal';
import { useAsyncError, useNavigate, useParams, useSearchParams } from 'react-router-dom';

import {
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
		helpers.setValue({ id: initialValue.value || undefined });
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
		helpers.setValue({ id: selected?.[0]?.value ?? undefined });
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

const DetailField = ({ field }: { field: EntityField }) => {
	if (field.relationshipType) {
		// @todo: For these fields we want both the ID and the name (value)
		return (
			<div className={styles.detailField}>
				<label htmlFor={field.name} className={styles.fieldLabel}>
					{field.name}
				</label>
				<SelectField name={field.name} entity={field} />
			</div>
		);
	}
	return (
		<div className={styles.detailField}>
			<label htmlFor={field.name} className={styles.fieldLabel}>
				{field.name}
			</label>
			<Field id={field.name} name={field.name} className={styles.textInputField} />
		</div>
	);
};

const DetailForm = ({
	initialValues,
	detailFields,
	onCancel,
	onSubmit,
}: {
	initialValues: Record<string, any>;
	detailFields: EntityField[];
	onSubmit: (values: any, actions: FormikHelpers<any>) => void;
	onCancel: () => void;
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
				</Form>
			)}
		</Formik>
	);
};

const SLIDE_ANIMATION_TIME_CSS_VAR_NAME = '--detail-panel-slide-animation-time';

export const DetailPanel = () => {
	const [open, setOpen] = useState(false);

	const { id } = useParams();
	const navigate = useNavigate();
	const { selectedEntity } = useSelectedEntity();
	const { entityByName, entityByType } = useSchema();
	const [search] = useSearchParams();

	if (!selectedEntity) throw new Error('There should always be a selected entity at this point.');

	const { data, loading } = useQuery<{ result: ResultBaseType }>(
		queryForEntity(selectedEntity, entityByName),
		{
			variables: { id },
			skip: id === 'new',
		}
	);

	const onClose = useCallback(() => {
		const { filters, sort } = decodeSearchParams(search);
		navigate(routeFor({ entity: selectedEntity, filters, sort }));
	}, [search, selectedEntity]);

	const getValue = (field: EntityField, result?: ResultBaseType) => {
		if (field.relationshipType) {
			const relatedEntity = entityByType(field.type);
			const relatedField = result?.[field.name] as Record<string, unknown> | undefined;

			if (!relatedField) {
				return undefined;
			}

			return {
				value: relatedField.id,
				label: relatedField
					? relatedField[relatedEntity?.summaryField || ('id' as keyof typeof result)]
					: '',
			};
		}
		return result?.[field.name as keyof typeof result];
	};

	// Weed out ID fields - for the moment.
	const formFields: EntityField[] = selectedEntity.fields.filter((field) => field.name !== 'id');

	const initialValues = formFields.reduce((acc, field) => {
		const result = data?.result;
		const value = getValue(field, result);
		acc[field.name] = value || '';
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
		setOpen(false);
		setTimeout(onClose, slideAnimationTime);
	};

	const handleOnSubmit = async (values: any, actions: FormikHelpers<any>) => {
		const id = data?.result?.id;

		if (id) {
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
		onClose();
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
					) : (
						<DetailForm
							initialValues={initialValues}
							detailFields={formFields}
							onCancel={closeModal}
							onSubmit={handleOnSubmit}
						/>
					)}
				</>
			}
		/>
	);
};
