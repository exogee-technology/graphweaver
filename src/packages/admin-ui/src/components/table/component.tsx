import { ReactElement, useCallback, useState } from 'react';
import styles from './styles.module.css';
import chevron from '~/assets/16-chevron-down.svg';

function TableHeader({
	tableData,
	handleClick,
	filterDirection,
}: {
	tableData: Array<object>;
	handleClick?: (header: string) => any;
	filterDirection: boolean;
}) {
	const [filteredColumn, setFilteredColumn] = useState(0);

	const headers = Object.keys(tableData[0]);
	const firstObject: any = tableData[0];

	// When the value is a number right align text
	const valueIsNumber = useCallback(
		(header: string) => (typeof firstObject[header] === 'number' ? styles.right : ''),
		[]
	);

	// Pass the column object key so we can filter on that column
	const filterOnColumn = useCallback(
		(header: string, index: number) => {
			handleClick?.(header);
			setFilteredColumn(index);
		},
		[handleClick, setFilteredColumn]
	);

	return (
		<tr id={styles.header}>
			{headers.map((header: string, index) => (
				<th
					onClick={() => {
						filterOnColumn(header, index);
					}}
					className={valueIsNumber(header)}
					id={filteredColumn === index ? styles.chevron : ''}
					key={header}
				>
					{header}
					<span>
						<img
							src={chevron}
							alt={`Filter ${header} ascending or descending`}
							className={filterDirection ? styles.pointUp : styles.pointDown}
						/>
					</span>
				</th>
			))}
		</tr>
	);
}

const TableRows = ({ tableData }: { tableData: Array<object> }) => (
	<>
		{tableData?.map((row, index) => (
			<tr key={index}>
				{Object.values(row).map((field) => (
					<td className={typeof field === 'number' ? styles.right : ''} key={Math.random()}>
						{field}
					</td>
				))}
			</tr>
		))}
	</>
);

export const Table = ({ data, headerData }: { data: Array<any>; headerData: Array<any> }) => (
	<div id={styles.tableWrapper}>
		<table id={styles.table}>
			<tbody>
				<TableHeader filterDirection tableData={headerData} />
				<TableRows tableData={data} />
			</tbody>
		</table>
	</div>
);
