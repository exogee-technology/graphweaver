import { apolloClient } from '../apollo';
import { useEffect, useState, useRef } from 'react';

import styles from './styles.module.css';

import { Button } from '../button';
import { Modal } from '../modal';
import { Spinner } from '../spinner';
import { TableRowItem } from '../table';

import toast from 'react-hot-toast';

import {
	exportToCSV,
	useSelectedEntity,
	useSchema,
	SortField,
	getOrderByQuery,
	Filter,
} from '../utils';
import { GetEntity } from './graphql';

export const ExportModal = ({
	closeModal,
	sort,
	filters,
}: {
	closeModal: () => void;
	sort?: SortField[];
	filters?: Filter;
}) => {
	const { selectedEntity } = useSelectedEntity();
	const { entityByName } = useSchema();
	const [displayPageNumber, setDisplayPageNumber] = useState(1);
	const abortRef = useRef(false);

	if (!selectedEntity) throw new Error('There should always be a selected entity at this point.');

	const pageSize = selectedEntity.attributes.exportPageSize || 200;

	const fetchAll = async () => {
		try {
			let pageNumber = 0;
			let hasNextPage = true;

			const allResults: TableRowItem[] = [];

			while (hasNextPage) {
				if (abortRef.current) {
					return;
				}

				const { data } = await apolloClient.query({
					query: GetEntity(selectedEntity, entityByName),
					variables: {
						pagination: {
							offset: pageNumber * pageSize,
							limit: pageSize,
							orderBy: getOrderByQuery(sort),
						},
						...(filters ? { filter: filters } : {}),
					},
					fetchPolicy: 'no-cache',
				});

				if (data && data.result.length > 0) {
					allResults.push(...data.result);
				}

				hasNextPage = data?.result.length === pageSize;
				pageNumber++;
				setDisplayPageNumber(pageNumber);
			}

			exportToCSV(selectedEntity.name, allResults);
		} catch (error) {
			toast.error(String(error), {
				duration: 5000,
			});
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
