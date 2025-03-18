import { EntityInformation } from '.';

export const pascalToKebabCaseString = (value: string) => {
	return value.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase();
};

export const baseUrlFromOperations = (operations: EntityInformation['operations']) => {
	const allOperations = Object.values(operations ?? {});
	if (allOperations.length === 0) return '';
	const commonPath = allOperations[0]?.path ?? '';

	// Iterate through all operations, compare the path for each and on the first difference, return what we have so far
	for (let i = 0; i < commonPath.length; i++) {
		const currentCharacter = commonPath[i];
		for (const operation of allOperations) {
			if (operation.path[i] !== currentCharacter) return commonPath.slice(0, i);
		}
	}

	// Is there more than one path element here? If so, trim that last one.
	return commonPath.split('/').slice(0, -1).join('/');
};

export const listPathFromOperations = (operations: EntityInformation['operations']) => {
	const fullPath = operations?.list?.path ?? operations?.getOne?.path ?? '';
	let listPath = fullPath.replace(baseUrlFromOperations(operations), '');

	// If the list path starts with a slash, remove it
	if (listPath.startsWith('/')) listPath = listPath.slice(1);

	return listPath;
};
