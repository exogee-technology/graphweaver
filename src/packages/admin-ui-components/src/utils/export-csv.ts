import Papa from 'papaparse';
import type { Column } from 'react-data-grid';
import { SelectOption } from '../multi-select';

export const getExportDataFromSource = <T>(columns: Column<T, unknown>[], source: T[]) => {
	const data =
		source.map((row, index) =>
			columns.map((c) => {
				const value = row[c.key as keyof T] as any;
				if (value) {
					if (value.hasOwnProperty('label')) {
						return (value as SelectOption).label;
					} else if (Array.isArray(value)) {
						return value
							.map((v) => (v.hasOwnProperty('label') ? (v as SelectOption).label : v))
							.join(',');
					}
				}
				return value;
			})
		) || [];

	return data;
};

export const exportToCSV = <T>(entityname: string, columns: Column<T, unknown>[], source: T[]) => {
	const data = getExportDataFromSource(columns, source);
	const dataString = Papa.unparse(
		{
			// TypeScript thinks that fields could be undefined, but it won't be.
			fields: columns.map((c) => c.name) as string[],
			data,
		},
		{ delimiter: ',' }
	);
	const blob = new Blob([dataString], { type: 'text/csv;charset=utf-8' });
	downloadFile(`${entityname} ${new Date().toString()}.csv`, blob);
};

function downloadFile(fileName: string, data: Blob) {
	const downloadLink = document.createElement('a');
	downloadLink.download = fileName;
	const url = URL.createObjectURL(data);
	downloadLink.href = url;
	downloadLink.click();
	URL.revokeObjectURL(url);
}
