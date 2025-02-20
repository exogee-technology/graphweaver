declare module 'virtual:graphweaver-user-supplied-custom-pages' {
	import { RouteObject } from '@exogee/graphweaver-admin-ui';
	import type { LoginProps } from '@exogee/graphweaver-admin-ui-components';

	export interface NavLinkExport {
		name: string;
		route: string;
	}

	export interface CustomPagesExport {
		defaultRoute?: string;
		routes: () => RouteObject[] | Promise<RouteObject[]>;
		navLinks: () => NavLinkExport[] | Promise<NavLinkExport[]>;
		loginProps?: LoginProps;
	}

	export const customPages: CustomPagesExport;
}
