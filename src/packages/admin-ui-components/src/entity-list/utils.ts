import { EntityField } from '../utils';

export const convertRowData = <TData>(data: { result: TData[] }, fields: EntityField[]) => {
	// If we have an array as a value then we need to convert this to a string to display in the table
	return (data?.result ?? []).map((row) => {
		// Hold any overrides we need to apply
		type OverrideKey = keyof typeof row;
		const overrides: { [k in OverrideKey]?: unknown } = {};

		for (const key in row) {
			const field = fields.find((field) => field.name === key);
			if (field?.type === 'JSON') {
				// We have an array let's stringify it so it can be displayed in the table
				overrides[key as OverrideKey] = JSON.stringify(row[key as OverrideKey]);
			} else if (field?.type === 'Boolean') {
				overrides[key as OverrideKey] = `${row[key as OverrideKey]}`;
			}
		}
		// override any arrays we have found
		return { ...row, ...overrides } as typeof row;
	});
};
