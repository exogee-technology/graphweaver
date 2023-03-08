import path from 'path';
import fs from 'fs/promises';

export const loadCustomPages = async (configPath: string) => {
	// The user must ensure they export a config object called 'dashboards' on the graphweaver
	// adminUI config to get them included.
	try {
		let customPagesPath = path.resolve(process.cwd(), 'src', 'admin-ui', 'custom-pages');

		try {
			const { adminUI } = await import(configPath);
			if (adminUI?.customPagesPath) customPagesPath = adminUI.customPagesPath;
		} catch (error) {
			// They are allowed not to have a config if they want, we just set a default.
		}

		// TODO: Additional validation like importing the object and making sure we get
		// the properties we expect.
		if ((await fs.stat(customPagesPath)).isDirectory()) {
			return `export { customPages } from '${customPagesPath}';`;
		}
	} catch (error) {
		// If we get an error here it's fine, we just won't load your dashboards if you have any.
	}

	return `export const customPages = {
		routes: () => [],
		navLinks: () => [],
	};`;
};
