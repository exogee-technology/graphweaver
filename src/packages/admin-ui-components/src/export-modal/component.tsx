import { apolloClient } from '../apollo';
import { useEffect, useState, useRef } from 'react';
import { Row } from '@tanstack/react-table';

import styles from './styles.module.css';

import { Button } from '../button';
import { Modal } from '../modal';
import { Spinner } from '../spinner';

import toast from 'react-hot-toast';

import {
	exportToCSV,
	useSelectedEntity,
	useSchema,
	getOrderByQuery,
	Filter,
	SortEntity,
} from '../utils';
import { listEntityForExport } from './graphql';

const DEFAULT_EXPORT_PAGE_SIZE = 200;

export const ExportModal = <TData extends object>({
	closeModal,
	sort,
	filters,
}: {
	closeModal: () => void;
	sort?: SortEntity;
	filters?: Filter;
}) => {
	const { selectedEntity } = useSelectedEntity();
	const { entityByName, federationSubgraphName } = useSchema();
	const [displayPageNumber, setDisplayPageNumber] = useState(1);
	const abortRef = useRef(false);

	if (!selectedEntity) throw new Error('There should always be a selected entity at this point.');

	const pageSize = selectedEntity.attributes.exportPageSize || DEFAULT_EXPORT_PAGE_SIZE;

	const fetchAll = async () => {
		try {
			let pageNumber = 0;
			let hasNextPage = true;

			const allResults: Row<TData>[] = [];

			while (hasNextPage) {
				if (abortRef.current) return;

				const primaryKeyField = selectedEntity.primaryKeyField;

				const { data } = await apolloClient.query({
					query: listEntityForExport(selectedEntity, entityByName, federationSubgraphName),
					variables: {
						pagination: {
							offset: pageNumber * pageSize,
							limit: pageSize,
							orderBy: getOrderByQuery({ primaryKeyField, sort }),
						},
						...(filters ? { filter: filters } : {}),
					},
					fetchPolicy: 'no-cache',
				});

				if (data && data.result.length > 0) allResults.push(...data.result);

				hasNextPage = data?.result.length === pageSize;
				pageNumber++;
				setDisplayPageNumber(pageNumber);
			}

			exportToCSV(selectedEntity.name, allResults);
		} catch (error) {
			console.error(error);
			toast.error(String(error), { duration: 5000 });
		} finally {
			closeModal();
		}
	};

	useEffect(() => {
		fetchAll();
	}, []);

	return (
		<Modal
			hideCloseX
			isOpen
			className={styles.exportContainer}
			title={`Export ${selectedEntity.name} to CSV`}
			modalContent={
				<div className={styles.contentContainer}>
					<p>
						Processing page {displayPageNumber} &#40;Fetching {pageSize} records&#41;
					</p>
					<Spinner />
					<div className={styles.buttonContainer}>
						<Button
							type="reset"
							onClick={() => {
								abortRef.current = true;
								closeModal();
							}}
						>
							Cancel
						</Button>
					</div>
				</div>
			}
		/>
	);
};
