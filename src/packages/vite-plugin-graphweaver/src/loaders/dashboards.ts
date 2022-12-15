import path from 'path';
import fs from 'fs/promises';
import { ViteGraphweaverOptions } from '..';

export const loadDashboards = async ({ dashboardDirectoryPath }: ViteGraphweaverOptions) => {
	if (!dashboardDirectoryPath) throw new Error('No dashboardDirectoryPath specified');

	// The user must ensure they export a config object called 'dashboards' in this directory to
	// get them included.

	try {
		const dashboardPath = path.resolve(process.cwd(), dashboardDirectoryPath);
		console.log('Loading dashboards from ', dashboardPath);

		// TODO: Import from here and validate instead of just statting the directory.
		// const result = await import(path.resolve(process.cwd(), dashboardDirectoryPath));

		if ((await fs.stat(dashboardDirectoryPath)).isDirectory()) {
			console.log('Found! Exporting them.');

			return `export { dashboards } from '${dashboardPath}';`;
		}
	} catch (error) {
		console.warn('Received error:');
		console.error(error);
		console.warn(`Ignoring dashboards in ${dashboardDirectoryPath}.`);
	}

	return `export const dashboards = [];`;
};
