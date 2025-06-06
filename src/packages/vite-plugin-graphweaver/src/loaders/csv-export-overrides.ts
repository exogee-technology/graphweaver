import { config } from '@exogee/graphweaver-config';
import { tryToResolvePath } from './util';

export const loadCsvExportOverrides = async (projectRoot: string) => {
	try {
		const { csvExportOverridesPath } = config(projectRoot).adminUI;
		if (!csvExportOverridesPath) {
			throw new Error(
				'No CSV export overrides path found. This should be specified by default, so this is an internal error. Please raise an issue on GitHub.'
			);
		}

		const resolvedCsvExportOverridesPath = await tryToResolvePath(csvExportOverridesPath);
		if (!resolvedCsvExportOverridesPath)
			throw new Error(`Couldn't find a file that matched the path: ${csvExportOverridesPath}`);

		// @todo Validate import- we can't import typescript here but we could validate another way

		return `export { csvExportOverrides } from '${resolvedCsvExportOverridesPath}';`;
	} catch {
		console.warn('No CSV export overrides found.');
		return `export const csvExportOverrides = {};`;
	}
};
