import { config } from '@exogee/graphweaver-config';
import { tryToResolvePath } from './util';

export const loadCustomFields = async (projectRoot: string) => {
	try {
		const { customFieldsPath } = config(projectRoot).adminUI;

		const resolvedCustomFieldsPath = await tryToResolvePath(customFieldsPath);
		if (!resolvedCustomFieldsPath) throw new Error("Couldn't find a file that matched the path");

		// @todo Validate import- we can't import typescript here but we could validate another way
		return `export { customFields } from '${resolvedCustomFieldsPath}';`;
	} catch (error) {
		console.warn('No custom fields component found');
		return `export const customFields = new Map();`;
	}
};
