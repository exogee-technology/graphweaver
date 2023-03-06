import path from 'path';
import fs from 'fs/promises';

export const loadDashboards = async (configPath: string) => {
	// The user must ensure they export a config object called 'dashboards' on the graphweaver
	// adminUI config to get them included.
	try {
		let dashboardPath = path.resolve(process.cwd(), 'src', 'dashboards');

		try {
			const { adminUI } = await import(configPath);
			if (adminUI?.dashboardPath) dashboardPath = adminUI.dashboardPath;
		} catch (error) {
			// They are allowed not to have a config if they want, we just set a default.
		}

		// TODO: Additional validation
		if ((await fs.stat(dashboardPath)).isDirectory()) {
			return `export { dashboards } from '${dashboardPath}';`;
		}
	} catch (error) {
		// If we get an error here it's fine, we just won't load your dashboards if you have any.
	}

	return `export const dashboards = [];`;
};
