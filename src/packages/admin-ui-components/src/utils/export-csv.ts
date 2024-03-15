import Papa from 'papaparse';

export const convertObjectValueToString = <T>(source: T[]) => {
	const getObjectValue = (item: any) =>
		item.hasOwnProperty('label') ? item['label'] : JSON.stringify(item);

	const data = source.map(
		(obj) =>
			obj &&
			Object.fromEntries(
				Object.entries(obj).map(([key, value]) => [
					key,
					value !== null && typeof value === 'object'
						? (Array.isArray(value) && value.map((item) => getObjectValue(item)).join(', ')) ||
							getObjectValue(value)
						: `${value}`,
				])
			)
	);
	return data;
};

export const exportToCSV = <T>(entityname: string, source: T[]) => {
	const data = convertObjectValueToString(source);
	const dataString = Papa.unparse(data);
	const blob = new Blob([dataString], { type: 'text/csv;charset=utf-8' });
	downloadFile(`${entityname} ${new Date().toString()}.csv`, blob);
};

const downloadFile = (fileName: string, data: Blob) => {
	const downloadLink = document.createElement('a');
	downloadLink.download = fileName;
	const url = URL.createObjectURL(data);
	downloadLink.href = url;
	downloadLink.click();
	URL.revokeObjectURL(url);
};
