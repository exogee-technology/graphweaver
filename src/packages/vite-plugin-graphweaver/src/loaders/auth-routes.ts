import { config } from '@exogee/graphweaver-config';

export const loadAuthRoutes = async () => {
	try {
		const { adminUI } = config();
		if (adminUI.auth) {
			return `export { loadRoutes } from '@exogee/graphweaver-auth-ui-components';`;
		} else {
			return `export const loadRoutes = () => [];`;
		}
	} catch (error) {
		console.warn('No custom pages component found');
		return `export const loadRoutes = () => [];`;
	}
};
