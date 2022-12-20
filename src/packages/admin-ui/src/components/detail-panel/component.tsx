import { ApolloQueryResult } from '@apollo/client';
import classnames from 'classnames';
import { Field, Form, Formik, useField } from 'formik';
import React, { useCallback, useState } from 'react';
import * as Modal from 'react-modal';
import { Await, useAsyncError, useLoaderData, useNavigate } from 'react-router-dom';

import { ReactComponent as ExitIcon } from '~/assets/close-button-svgrepo-com.svg';
import { routeFor } from '~/utils/route-for';
import { Entity, EntityField, useSchema } from '~/utils/use-schema';
import { useSelectedEntity } from '~/utils/use-selected-entity';
import { Button } from '../button';

import { Select, SelectOption } from '../select';

import styles from './styles.module.css';

interface ResultBaseType {
	id: string;
}

const DetailPanelError = () => {
	const error = useAsyncError() as Error;

	console.error(error);

	return <pre className={styles.wrapper}>Error!: {error.message}</pre>;
};

const SelectField = ({ name }: { name: string }) => {
	const [field, meta] = useField({ name, multiple: false });
	const { initialValue } = meta;

	const initialOption: SelectOption = { label: initialValue, value: initialValue };
	const options = [initialOption];

	return <Select options={options} onChange={field.onChange} defaultValue={initialOption} />;
};

const DetailField = ({ field }: { field: EntityField }) => {
	if (field.relationshipType) {
		return (
			<div className={styles.detailField}>
				<label htmlFor={field.name} className={styles.fieldLabel}>
					{field.name}
				</label>
				<SelectField name={field.name} />
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
}: {
	initialValues: Record<string, any>;
	detailFields: EntityField[];
	onCancel: () => void;
}) => {
	return (
		<Formik
			initialValues={initialValues}
			onSubmit={(values, actions) => {
				setTimeout(() => {
					alert(JSON.stringify(values, null, 2));
					actions.setSubmitting(false);
					onCancel();
				}, 500);
			}}
			onReset={onCancel}
		>
			<Form className={styles.detailFormContainer}>
				<div className={styles.detailFieldList}>
					{detailFields.map((field) => {
						return <DetailField key={field.name} field={field} />;
					})}
					<div className={styles.detailButtonContainer}>
						<Button type={'reset'}>Cancel</Button>
						<Button type={'submit'}>Save</Button>
					</div>
				</div>
			</Form>
		</Formik>
	);
};

const ModalContent = ({
	selectedEntity,
	detail,
}: {
	selectedEntity: Entity;
	detail: ApolloQueryResult<{ result: ResultBaseType }>;
}) => {
	const [isOpen, setOpen] = useState<boolean>(true);
	const navigate = useNavigate();
	const { entityByType } = useSchema();

	const navigateBack = useCallback(() => navigate(routeFor({ entity: selectedEntity })), [
		selectedEntity,
	]);

	const cancel = () => {
		setOpen(false);
		navigateBack();
	};

	// TODO: Modal.setAppElement

	const getValue = (field: EntityField, result: any) => {
		if (field.relationshipType) {
			const relatedEntity = entityByType(field.type);
			// TODO: For select fields we want both the summaryField *and* the ID for the SelectOption
			const relatedField = result[field.name];
			return relatedField
				? relatedField[relatedEntity?.summaryField || ('id' as keyof typeof result)]
				: '';
		}
		return result[field.name as keyof typeof result];
	};

	/// Weed out ID fields - for the moment.
	const formFields: EntityField[] = selectedEntity.fields.filter((field) => field.name !== 'id');

	const initialValues = formFields.reduce((acc, field) => {
		const { result } = detail.data;
		const value = getValue(field, result);
		acc[field.name] = value || '';
		return acc;
	}, {} as Record<string, any>);

	return (
		<Modal
			isOpen={isOpen}
			onRequestClose={cancel}
			shouldCloseOnEsc
			shouldCloseOnOverlayClick
			className={
				isOpen ? styles.detailContainer : classnames(styles.detailContainer, styles.finished)
			}
			overlayClassName={styles.modalOverlay}
			// Temp till setAppElement used
			ariaHideApp={false}
		>
			<div className={styles.detailIconContainer}>
				<ExitIcon className={styles.closeIcon} onClick={cancel} />
			</div>
			<div className={styles.detailLabel}>{selectedEntity.name}</div>
			<div>
				<div className={styles.idContent}>id: {detail.data.result.id}</div>
				<DetailForm initialValues={initialValues} detailFields={formFields} onCancel={cancel} />
			</div>
		</Modal>
	);
};

export const DetailPanel = () => {
	const { detail } = useLoaderData() as { detail: any };
	const { selectedEntity } = useSelectedEntity();

	if (!detail) return null;

	return (
		<React.Suspense fallback={<pre className={styles.wrapper}>Loading...</pre>}>
			<Await resolve={detail} errorElement={<DetailPanelError />}>
				{(detail: ApolloQueryResult<{ result: ResultBaseType }>) => {
					if (!selectedEntity)
						throw new Error('There should always be a selected entity at this point.');

					/// TODO: Remove these when required - placeholders while the API is incomplete
					if (detail.error) {
						console.error('Apollo query error:', detail.error.message);
					}
					if (detail.errors) {
						console.error('GraphQL errors: ', detail.errors.map((err) => err.message).join(','));
					}
					if (detail.data.result === null) {
						return <pre className={styles.wrapper}>Data result is null</pre>;
					}

					return <ModalContent selectedEntity={selectedEntity} detail={detail} />;
				}}
			</Await>
		</React.Suspense>
	);
};
