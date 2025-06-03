import { useEffect, useState, useRef } from 'react';
import { QueryOptions } from '@apollo/client';
import { Row } from '@tanstack/react-table';
import toast from 'react-hot-toast';
import { csvExportOverrides } from 'virtual:graphweaver-admin-ui-csv-export-overrides';

import { apolloClient } from '../apollo';
import { Button } from '../button';
import { Modal } from '../modal';
import { Spinner } from '../spinner';
import { exportToCSV, useSelectedEntity, useSchema, Filter, SortEntity } from '../utils';

import { defaultQuery } from './graphql';
import styles from './styles.module.css';

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
	const { entityByName } = useSchema();
	const [displayPageNumber, setDisplayPageNumber] = useState(1);
	const [displayTotalPages, setDisplayTotalPages] = useState<number | undefined>();
	const abortRef = useRef(false);

	if (!selectedEntity) throw new Error('There should always be a selected entity at this point.');

	const csvOverrides = csvExportOverrides[selectedEntity.name];
	const pageSize = selectedEntity.attributes.exportPageSize || DEFAULT_EXPORT_PAGE_SIZE;

	if (csvOverrides?.query && csvOverrides?.queryOptions) {
		throw new Error(
			`Both query and queryOptions were specified for the '${selectedEntity.name}' entity CSV export override options. You can specify query, or queryOptions, but not both.`
		);
	}

	const fetchAll = async () => {
		try {
			let pageNumber = 0;
			let hasNextPage = true;

			let allResults: Row<TData>[] = [];

			while (hasNextPage) {
				if (abortRef.current) return;

				let queryOptions: QueryOptions<any, any> | undefined = await csvOverrides?.queryOptions?.({
					selectedEntity,
					entityByName,
					pageNumber,
					pageSize,
					sort,
					filters,
				});

				queryOptions ??= await defaultQuery({
					selectedEntity,
					entityByName,
					queryOverride: csvOverrides?.query,
					pageNumber,
					pageSize,
					sort,
					filters,
				});

				const { data } = await apolloClient.query(queryOptions);

				if (data && data.result.length > 0) allResults.push(...data.result);

				hasNextPage = data?.result.length === pageSize;
				pageNumber++;
				setDisplayPageNumber(pageNumber);

				if (data?.aggregate?.count) {
					const totalPages = Math.ceil(data.aggregate.count / pageSize);
					setDisplayTotalPages(totalPages);
				}
			}

			if (csvOverrides?.mapResults) {
				allResults = await csvOverrides.mapResults(allResults);
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
						Processing page {displayPageNumber}{' '}
						{displayTotalPages &&
							`of ${displayTotalPages} page${displayTotalPages !== 1 ? 's' : ''}`}
					</p>
					<p>&#40;Fetching {pageSize} records per page&#41;</p>
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
