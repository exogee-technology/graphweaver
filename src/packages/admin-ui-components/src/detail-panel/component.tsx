import { ApolloQueryResult } from '@apollo/client';
import { useCallback, useEffect, useState } from 'react';
import { useAsyncError, useNavigate, useParams } from 'react-router-dom';
import { useSelectedEntity, routeFor, getEntity } from '../utils';
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
		if (id) {
			const result = await getEntity(selectedEntity, id);
			if (result) setDetail(result);
		}
	}, [id]);

	// Don't put fetchData into dependency array here - causes inf loop
	useEffect(() => {
		fetchData()
			// TODO: error handling
			.catch(console.error);
	}, [id]);

	const navigateBack = useCallback(
		() => navigate(routeFor({ entity: selectedEntity })),
		[selectedEntity]
	);

	if (!detail) return null;

	if (detail.loading) {
		return <pre>Loading...</pre>;
	}
	if (detail.error) {
		return <DetailPanelError />;
	}

	return <pre className={styles.wrpper}>{JSON.stringify(detail.data.result, null, 4)}</pre>;
};
