import { ApolloQueryResult } from '@apollo/client';
import React, { useCallback, useState } from 'react';
import { ReactComponent as ExitIcon } from '~/assets/close-button-svgrepo-com.svg';
import { Await, useAsyncError, useLoaderData, useNavigate } from 'react-router-dom';
import { Entity, EntityField, useSchema } from '~/utils/use-schema';
import { useSelectedEntity } from '~/utils/use-selected-entity';
/** @see https://reactcommunity.org/react-modal/ */
import * as Modal from 'react-modal';
import styles from './styles.module.css';
import { routeFor } from '~/utils/route-for';

import { Field, Form, Formik } from 'formik';

interface ResultBaseType {
	id: string;
}

type ResultType = keyof ResultBaseType;

// TODO: Move to test utils
// Do-nothing func as placeholder for event handlers
export function fakeCallback(msg: string): any {
	return function() {
	  // tslint:disable-next-line:no-console
	  console.log(msg, Array.from(arguments));
	  return new Promise<void>((resolve) => {
		setTimeout(resolve, 1000);
	  });
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
		<div>
			<label htmlFor={fieldName} className={styles.formLabel}>{fieldName}</label>
			<Field id={fieldName} name={fieldName} className={styles.modalContent} />
		</div>
	)
}

const DetailForm = (props: {initialValues: Record<string, any>, detailFields: string[]}) => {
	const { initialValues, detailFields } = props;
	return (
		<Formik
			initialValues={initialValues}
			onSubmit={fakeCallback("Formik onSubmit")}
		>
			<Form>
				{detailFields.map(fieldName => {
					return <DetailField key={fieldName} fieldName={fieldName} />
				})}

				{/* <label htmlFor="email">Email</label>
				<Field
				id="email"
				name="email"
				placeholder="john@acme.com"
				type="email"
				/> */}
				<button type="submit" className={styles.formButton}>Submit</button>
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

	/// Weed out FKs and ID field
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
				className={styles.modalBodyOpen}
				overlayClassName={styles.modalOverlay}
				// Temp till setAppElement used
				ariaHideApp={false}
			>
				<div className={styles.modalButtons}><ExitIcon style={{ width: '20px', color: '#7038c2' }} onClick={cancel}/></div>
				<div>
					<div className={styles.idContent}>id: {detail.data.result.id}</div>
					<DetailForm initialValues={initialValues} detailFields={formFields.map(field => field.name)} />
					{/* {selectedEntity.fields
						.filter(field => field.name !== "id")
						.filter(field => !field.relationshipType).map(field => (
						<div key={field.name} className={styles.modalContent}>{field.name}: {detail.data.result[field.name as ResultType]}</div>
					))} */}
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

					if (detail.error) { console.error("Apollo query error:", detail.error.message) }
					if (detail.errors) { console.error("GraphQL errors: ", detail.errors.map(err => err.message).join(',')) }
					if (detail.data.result === null) { 
						return <pre className={styles.wrapper}>
						 	Data result is null
						 </pre>
					}

					return <ModalContent selectedEntity={selectedEntity} detail={detail} />
					// return <pre className={styles.wrapper}>
					// 	{JSON.stringify(detail.data.result, null, 4)}
					// 	{JSON.stringify(rec, null, 4)}
					// </pre>
				}}
			</Await>
		</React.Suspense>
	);
};
