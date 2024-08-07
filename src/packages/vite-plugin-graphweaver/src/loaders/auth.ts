import { config } from '@exogee/graphweaver-config';

const defaultReturn = `export const loadRoutes = () => [];
export const SignOut = () => null;`;

export const loadAuth = async () => {
	try {
		const { adminUI } = config();
		if (adminUI.auth) {
			return `export { loadRoutes, SignOut } from '@exogee/graphweaver-auth-ui-components';`;
		} else {
			return defaultReturn;
		}
	} catch (error) {
		console.warn('No custom pages component found');
		return defaultReturn;
	}
};
