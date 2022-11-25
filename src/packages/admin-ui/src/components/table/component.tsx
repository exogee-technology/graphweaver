import DataGrid, { Column, SortColumn } from 'react-data-grid';
import { useCallback, useEffect, useState } from 'react';

import 'react-data-grid/lib/styles.css';
import './table-styles.css';

import styles from './styles.module.css';
import { Entity, useSchema } from '~/utils/use-schema';
import { getEntityPage } from '~/utils/get-entity-page';

const urlForEntity = (type: string, id: string) => {
	const cleanType = type.replaceAll(/[^a-zA-Z\d]/g, '');
	return `/${cleanType}/${id}`;
};

const columnsForEntity = <T extends { id: string }>(
	entity: Entity,
	entityByType: (type: string) => Entity
): Column<T>[] =>
	entity.fields.map((field) => ({
		key: field.name,
		name: field.name,
		width: field.type === 'ID!' || field.type === 'ID' ? 20 : 200,

		// We don't support sorting by relationships yet.
		sortable: !field.relationshipType,

		// We only need a formatter for relationships.
		formatter: field.relationshipType
			? ({ row }) => {
					const value = (row as any)[field.name];
					const relatedEntity = entityByType(field.type);

					if (Array.isArray(value)) {
						// We're in a many relationship. Return an array of links.
						return (
							<>
								{value.map((value) => (
									<a key={value.id} href={urlForEntity(field.type, value.id)}>
										{value[relatedEntity?.summaryField || 'id']}
									</a>
								))}
							</>
						);
					} else if (value) {
						return (
							<a href={urlForEntity(field.type, value.id)}>
								{value[relatedEntity?.summaryField || 'id']}
							</a>
						);
					} else {
						return null;
					}
			  }
			: undefined,
	}));

export const Table = <T extends { id: string }>({
	selectedEntity,
}: {
	selectedEntity?: Entity;
}) => {
	const [sortColumns, setSortColumns] = useState<readonly SortColumn[]>([]);
	const [nextPage, setNextPage] = useState(0);
	const [loading, setLoading] = useState(false);
	const [rows, setRows] = useState<T[]>([]);
	const { entityByType } = useSchema();

	const rowKeyGetter = useCallback((row: T) => row.id, []);

	const loadMore = async () => {
		if (loading) return;
		if (!selectedEntity) return;

		setLoading(true);

		const { result } = await getEntityPage<T>(selectedEntity, sortColumns, entityByType, nextPage);

		setRows((rows) => [...rows, ...result]);
		setNextPage((prev) => prev + 1);
		setLoading(false);
	};

	const handleScroll = useCallback(({ currentTarget }: React.UIEvent<HTMLDivElement>) => {
		// Are we at the bottom?
		if (currentTarget.scrollTop + 10 >= currentTarget.scrollHeight - currentTarget.clientHeight) {
			// Yes, load next page if we're not already loading it.
			loadMore();
		}
	}, []);

	// Load data whenever the selected entity or sort columns changes.
	useEffect(() => {
		setNextPage(0);
		setRows([]);
		setLoading(false);

		// Delay to ensure set state calls take effect before trying to load more.
		setTimeout(loadMore, 0);
	}, [selectedEntity, sortColumns]);

	if (!selectedEntity) return 'Select an Entity to Display';

	return (
		<div className={styles.tableWrapper}>
			{loading && <div className={styles.loadingPanel}>Loading</div>}

			<DataGrid
				columns={columnsForEntity(selectedEntity, entityByType) as any}
				rows={rows}
				rowKeyGetter={rowKeyGetter}
				sortColumns={sortColumns}
				onScroll={handleScroll}
				onSortColumnsChange={setSortColumns}
				defaultColumnOptions={{ resizable: true }}
			/>
		</div>
	);
};
