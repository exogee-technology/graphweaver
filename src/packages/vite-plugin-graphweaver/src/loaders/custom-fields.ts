import path from 'path';
import fs from 'fs/promises';

export const loadCustomFields = async (configPath: string) => {
	try {
		let customFieldsPath = path.resolve(process.cwd(), 'src', 'admin-ui', 'custom-fields');

		try {
			const { adminUI } = await import(configPath);
			if (adminUI?.customFieldsPath) customFieldsPath = adminUI.customFieldsPath;
		} catch (error) {
			// They are allowed not to have a config if they want, we just set a default.
		}

		// TODO: Additional validation like importing the object and making sure we get
		// the properties we expect.
		if ((await fs.stat(customFieldsPath)).isDirectory()) {
			return `export { customFields } from '${customFieldsPath}';`;
		}
	} catch (error) {
		// If we get an error here it's fine, we just won't load your dashboards if you have any.
	}

	return `export const customFields = new Map();`;
};
