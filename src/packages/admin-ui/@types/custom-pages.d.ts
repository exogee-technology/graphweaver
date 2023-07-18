declare module 'virtual:graphweaver-user-supplied-custom-pages' {
	import { RouteObject } from 'react-router-dom';
	import type { LoginProps } from '@exogee/graphweaver-admin-ui-components';

	export interface NavLinkExport {
		name: string;
		route: string;
	}

	export interface CustomPagesExport {
		routes: () => RouteObject[] | Promise<RouteObject[]>;
		navLinks: () => NavLinkExport[] | Promise<NavLinkExport[]>;
		loginProps?: LoginProps;
	}

	export const customPages: CustomPagesExport;
}
