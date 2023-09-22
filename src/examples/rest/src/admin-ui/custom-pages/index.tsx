import { routes } from '@exogee/graphweaver-auth-ui-components';

export const customPages = {
	routes: () => [...routes.password, ...routes.magicLink],
};
