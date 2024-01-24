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
	FieldFilter,
	wrapFilterWithAndOperator,
	getOrderByQuery,
} from '../utils';
import { GetEntity } from './graphql';

const pageSizeVar = import.meta.env.VITE_EXPORT_PAGE_SIZE;
const pageSize = pageSizeVar ? parseInt(pageSizeVar) : 200;

export const ExportModal = ({
	showModal,
	closeModal,
	sort,
	filters,
}: {
	showModal: boolean;
	closeModal: () => void;
	sort?: SortField[];
	filters?: FieldFilter;
}) => {
	const { selectedEntity } = useSelectedEntity();
	const { entityByName } = useSchema();
	const [displayPageNumber, setDisplayPageNumber] = useState(1);
	const abortRef = useRef(false);

	if (!selectedEntity) throw new Error('There should always be a selected entity at this point.');

	const closeAndReset = () => {
		abortRef.current = false;
		closeModal();
		setDisplayPageNumber(1);
	};

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
						...(filters ? { filter: wrapFilterWithAndOperator(filters) } : {}),
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
			closeAndReset();
		}
	};

	useEffect(() => {
		if (showModal) {
			fetchAll();
		}
	}, [showModal]);

	return (
		<Modal
			hideCloseX
			isOpen={showModal}
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
							onClick={() => {
								abortRef.current = true;
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
