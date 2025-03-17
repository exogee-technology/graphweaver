import { config } from '@exogee/graphweaver-config';

const defaultReturn = `export const loadRoutes = () => [];
export const SignOut = () => null;
export const customFields = new Map();`;

export const loadAuth = async () => {
	try {
		const { adminUI } = config();
		if (adminUI.auth?.primaryMethods) {
			return `export { loadRoutes, SignOut, customFields } from '@exogee/graphweaver-auth-ui-components';`;
		} else {
			return defaultReturn;
		}
	} catch {
		console.warn('No custom pages component found');
		return defaultReturn;
	}
};
