import { ApolloQueryResult } from '@apollo/client';
import classnames from 'classnames';
import { Field, Form, Formik } from 'formik';
import React, { useCallback, useState } from 'react';
/** @see https://reactcommunity.org/react-modal/ */
import * as Modal from 'react-modal';
import { Await, useAsyncError, useLoaderData, useNavigate } from 'react-router-dom';

import { ReactComponent as ExitIcon } from '~/assets/close-button-svgrepo-com.svg';
import { routeFor } from '~/utils/route-for';
import { Entity } from '~/utils/use-schema';
import { useSelectedEntity } from '~/utils/use-selected-entity';

import styles from './styles.module.css';

interface ResultBaseType {
	id: string;
}

type ResultType = keyof ResultBaseType;

// TODO: Move to test utils
// Do-nothing func as placeholder for event handlers
export function _fakeCallback(msg: string, action?: () => void): any {
	return function() {
	  // tslint:disable-next-line:no-console
	  console.info(msg, Array.from(arguments));
	  return new Promise<void>((resolve) => {
		setTimeout(resolve, 1000);
	  }).then(_resolve => action && action());
	};
  }

const DetailPanelError = () => {
	const error = useAsyncError() as Error;

	console.error(error);

	return <pre className={styles.wrapper}>Error!: {error.message}</pre>;
};

const DetailField = (props: {fieldName: string}) => {
	const { fieldName } = props;
	return (
		<div className={styles.detailField}>
			<label htmlFor={fieldName} className={styles.fieldLabel}>{fieldName}</label>
			<Field id={fieldName} name={fieldName} className={styles.textInputField} />
		</div>
	)
}

const DetailForm = (props: {initialValues: Record<string, any>, detailFields: string[], onCancel: () => void}) => {
	const { initialValues, detailFields, onCancel } = props;
	return (
		<Formik
			initialValues={initialValues}
			onSubmit={_fakeCallback("Formik onSubmit", onCancel)}
			onReset={onCancel}
		>
			<Form className={styles.detailFormContainer}>
				<div className={styles.detailFieldList}>
					{detailFields.map(fieldName => {
						return <DetailField key={fieldName} fieldName={fieldName} />
					})}
					<div className={styles.detailButtonContainer}>
						<button type="reset" className={styles.cancelButton}>Cancel</button>
						<button type="submit" className={styles.saveButton}>Save</button>
					</div>
				</div>
			</Form>		
		</Formik>
	)
}


const ModalContent = (props: { selectedEntity: Entity, detail: ApolloQueryResult<{ result: ResultBaseType }> }) => {
	const { selectedEntity, detail } = props;
	const [isOpen, setOpen] = useState<boolean>(true);
	const navigate = useNavigate();

	const navigateBack = useCallback(() =>
		navigate(routeFor({ entity: selectedEntity })), [selectedEntity]
	)

	const cancel = () => {
		setOpen(false);
		navigateBack();
	};

	// TODO: Modal.setAppElement

	/// Weed out relations and ID fields - for the moment.
	const formFields = selectedEntity.fields 
		.filter(field => field.name !== "id")
		.filter(field => !field.relationshipType);

	const initialValues = formFields
		.reduce((acc,field) => {
			const fieldName = field.name;
			const value = detail.data.result[fieldName as ResultType];
			acc[fieldName] = value;
			return acc;
		},{} as Record<string, any>);

	return (
		<div>
			<Modal
				isOpen={isOpen}
				onRequestClose={cancel}
				shouldCloseOnEsc
				shouldCloseOnOverlayClick
				// parentSelector={() => document.querySelector('#root')}>
				className={isOpen ? styles.detailContainer : classnames(styles.detailContainer, styles.finished)}
				overlayClassName={styles.modalOverlay}
				// Temp till setAppElement used
				ariaHideApp={false}
			>
				<div className={styles.detailIconContainer}><ExitIcon className={styles.closeIcon} onClick={cancel}/></div>
				<div className={styles.detailLabel}>{selectedEntity.name}</div>
				<div>
					<div className={styles.idContent}>id: {detail.data.result.id}</div>
					<DetailForm initialValues={initialValues} detailFields={formFields.map(field => field.name)} onCancel={cancel} />
				</div>
				
			</Modal>

		</div>
	)
}

export const DetailPanel = () => {
	const { detail } = useLoaderData() as { detail: any };
	const { selectedEntity } = useSelectedEntity();


	if (!detail) return null;

	return (
		// TODO: Loading into modal - maybe invert this so that the React.Suspense component is in the modal?
		<React.Suspense fallback={<pre className={styles.wrapper}>Loading...</pre>}>
			<Await resolve={detail} errorElement={<DetailPanelError />}>
			{(detail: ApolloQueryResult<{ result: ResultBaseType }>) => {
					if (!selectedEntity) throw new Error('There should always be a selected entity at this point.');

					/// TODO: Remove these when required - placeholders while the API is incomplete
					if (detail.error) { console.error("Apollo query error:", detail.error.message) }
					if (detail.errors) { console.error("GraphQL errors: ", detail.errors.map(err => err.message).join(',')) }
					if (detail.data.result === null) { 
						return <pre className={styles.wrapper}>
						 	Data result is null
						 </pre>
					}

					return <ModalContent selectedEntity={selectedEntity} detail={detail} />
					// Debug output
					// return <pre className={styles.wrapper}>
					// 	{JSON.stringify(detail.data.result, null, 4)}
					// </pre>
				}}
			</Await>
		</React.Suspense>
	);
};
