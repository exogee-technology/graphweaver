import Papa from 'papaparse';
import { Entity } from './use-schema';

export const convertObjectValueToString = <T>(entity: Entity,source: T[], entityByType: (entityType: string) => Entity) => {
	const getObjectValue = (item: any, summaryField: string | null | undefined) =>
		summaryField && item.hasOwnProperty(summaryField)  ? item[summaryField] : JSON.stringify(item);

	const data = source.map(
		(obj) =>
			obj &&
			Object.fromEntries(
				Object.entries(obj).map(([key, value]) => {
					const field = entity.fields.find((field) => field.name === key);
					if (!field) {
						return [key, null]
					}

					const childEntity = entityByType(field.type);

					return [
					key,
					value !== null && typeof value === 'object'
						? (Array.isArray(value) && value.map((item) => getObjectValue(item, childEntity?.summaryField)).join(', ')) ||
							getObjectValue(value, childEntity?.summaryField)
						: `${value}`,
				]})
			)
	);
	return data;
};

export const exportToCSV = <T>(entity: Entity, source: T[], entityByType: (entityType: string) => Entity) => {
	const entityName = entity.name
	const data = convertObjectValueToString(entity, source, entityByType);
	const dataString = Papa.unparse(data);
	const blob = new Blob([dataString], { type: 'text/csv;charset=utf-8' });
	downloadFile(`${entityName} ${new Date().toString()}.csv`, blob);
};

const downloadFile = (fileName: string, data: Blob) => {
	const downloadLink = document.createElement('a');
	downloadLink.download = fileName;
	const url = URL.createObjectURL(data);
	downloadLink.href = url;
	downloadLink.click();
	URL.revokeObjectURL(url);
};
