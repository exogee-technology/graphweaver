import { ApolloQueryResult } from '@apollo/client';
import classnames from 'classnames';
import { Field, Form, Formik, useField } from 'formik';
import React, { useCallback, useState } from 'react';
/** @see https://reactcommunity.org/react-modal/ */
import * as Modal from 'react-modal';
import { Await, useAsyncError, useLoaderData, useNavigate } from 'react-router-dom';

import { ReactComponent as ExitIcon } from '~/assets/close-button-svgrepo-com.svg';
import { routeFor } from '~/utils/route-for';
import { Entity, EntityField, useSchema } from '~/utils/use-schema';
import { useSelectedEntity } from '~/utils/use-selected-entity';
// import { Button } from '../button';

import styles from './styles.module.css';
import buttonStyles from '../button/styles.module.css';
import { Select, SelectOption } from '../select';

interface ResultBaseType {
	id: string;
}

type ResultType = keyof ResultBaseType;

// TODO: Move to test utils
// Do-nothing func as placeholder for event handlers
export function _fakeCallback(msg: string, action?: () => void): any {
	return async function () {
		// tslint:disable-next-line:no-console
		console.info(msg, Array.from(arguments));
		return new Promise<void>((resolve) => {
			setTimeout(resolve, 1000);
		}).then((_resolve) => action && action());
	};
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

	// const { setValue } = helpers;

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
			onSubmit={_fakeCallback('Formik onSubmit', onCancel)}
			onReset={onCancel}
		>
			<Form className={styles.detailFormContainer}>
				<div className={styles.detailFieldList}>
					{detailFields.map((field) => {
						return <DetailField key={field.name} field={field} />;
					})}
					<div className={styles.detailButtonContainer}>
						<button type="reset" className={styles.cancelButton}>
							Cancel
						</button>
						{/* <Button handleClick={_fakeCallback("Button onSubmit", onCancel)}>Save</Button> */}
						<button type="submit" className={buttonStyles.button}>
							Save
						</button>
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
			return result[field.name][relatedEntity?.summaryField || ('id' as keyof typeof result)];
		}
		return result[field.name as keyof typeof result];
	};

	/// Weed out ID fields - for the moment.
	const formFields: EntityField[] = selectedEntity.fields.filter((field) => field.name !== 'id');

	const initialValues = formFields.reduce((acc, field) => {
		const { result } = detail.data;
		const value = getValue(field, result);
		acc[field.name] = value;
		return acc;
	}, {} as Record<string, any>);

	return (
		// <div>
		<Modal
			isOpen={isOpen}
			onRequestClose={cancel}
			shouldCloseOnEsc
			shouldCloseOnOverlayClick
			// parentSelector={() => document.querySelector('#root')}>
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

		// </div>
	);
};

export const DetailPanel = () => {
	const { detail } = useLoaderData() as { detail: any };
	const { selectedEntity } = useSelectedEntity();

	if (!detail) return null;

	return (
		// TODO: Loading into modal - maybe invert this so that the React.Suspense component is in the modal?
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
					// Debug output
					// return <pre className={styles.wrapper}>
					// 	{JSON.stringify(detail.data.result, null, 4)}
					// </pre>
				}}
			</Await>
		</React.Suspense>
	);
};
