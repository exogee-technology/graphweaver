import { config } from '@exogee/graphweaver-config';
import { tryToResolvePath } from './util';

export const loadCustomPages = async (projectRoot: string) => {
	try {
		const { customPagesPath } = config(projectRoot).adminUI;
		if (!customPagesPath) {
			throw new Error(
				'No custom pages path found. This should be specified by default, so this is an internal error. Please raise an issue on GitHub.'
			);
		}

		const resolvedCustomPagesPath = await tryToResolvePath(customPagesPath);
		if (!resolvedCustomPagesPath) throw new Error("Couldn't find a file that matched the path");

		// @todo Validate import- we can't import typescript here but we could validate another way

		return `export { customPages } from '${resolvedCustomPagesPath}';`;
	} catch {
		console.warn('No custom pages component found');
		return `export const customPages = {
		routes: () => [],
		navLinks: () => [],
		sidebarFooter: undefined,
	};`;
	}
};
