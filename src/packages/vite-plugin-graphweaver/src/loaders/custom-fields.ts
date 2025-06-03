import { config } from '@exogee/graphweaver-config';
import { tryToResolvePath } from './util';

export const loadCustomFields = async (projectRoot: string) => {
	try {
		const { customFieldsPath } = config(projectRoot).adminUI;

		if (!customFieldsPath) {
			throw new Error(
				'No custom fields path found. This should be specified by default, so this is an internal error. Please raise an issue on GitHub.'
			);
		}

		const resolvedCustomFieldsPath = await tryToResolvePath(customFieldsPath);
		if (!resolvedCustomFieldsPath) throw new Error("Couldn't find a file that matched the path");

		// @todo Validate import- we can't import typescript here but we could validate another way
		return `export { customFields } from '${resolvedCustomFieldsPath}';`;
	} catch {
		console.warn('No custom fields component found');
		return `export const customFields = new Map();`;
	}
};
