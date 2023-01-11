import { ApolloQueryResult, NetworkStatus } from '@apollo/client';
import { useCallback, useEffect, useState } from 'react';
import * as Modal from 'react-modal';
import { useAsyncError, useNavigate, useParams } from 'react-router-dom';
import { useEntityFetch } from '~/pages';
import { routeFor } from '~/utils/route-for';
import { useSelectedEntity } from '~/utils/use-selected-entity';
import styles from './styles.module.css';

const DetailPanelError = () => {
	const error = useAsyncError() as Error;

	console.error(error);

	return <pre className={styles.wrapper}>Error!: {error.message}</pre>;
};

export const DetailPanel = () => {
	const { id } = useParams();
	const navigate = useNavigate();
	const { selectedEntity } = useSelectedEntity();
	if (!selectedEntity) throw new Error('There should always be a selected entity at this point.');
	const [detail, setDetail] = useState<ApolloQueryResult<any> | undefined>();

	const fetchData = useCallback(async () => {
		const result = await useEntityFetch(selectedEntity.name, id);
		if (result) {
			setDetail(result);
		}
	}, [id]);

	// Don't put fetchData into dependency array here - causes inf loop
	useEffect(() => {
		fetchData()
			// TODO: error handling
			.catch(console.error);
	}, [id]);

	const navigateBack = useCallback(() => navigate(routeFor({ entity: selectedEntity })), [
		selectedEntity,
	]);

	const cancel = () => {
		navigateBack();
	};

	if (!detail) return null;

	if (detail.loading) {
		return <pre>Loading...</pre>;
	}
	if (detail.error) {
		return <DetailPanelError />;
	}

	return (
		<Modal
			isOpen={id !== undefined}
			overlayClassName={styles.modalOverlay}
			className={styles.detailContainer}
			onRequestClose={cancel}
			shouldCloseOnEsc
			shouldCloseOnOverlayClick
			// TODO: suppress following warning: 'Warning: react-modal: App element is not defined. Please use `Modal.setAppElement(el)` or set `appElement={el}`. This is needed so screen readers don't see main content when modal is opened'
			ariaHideApp={false}
		>
			<pre className={styles.wrpper}>{JSON.stringify(detail.data.result, null, 4)}</pre>
		</Modal>
	);
};
