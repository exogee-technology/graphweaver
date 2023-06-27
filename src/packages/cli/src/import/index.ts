import { introspection } from '@exogee/graphweaver-mikroorm';

export const importDataSource = async () => {
	console.log('importDataSource...');
	await introspection();
};
