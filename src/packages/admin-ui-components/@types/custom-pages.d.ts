declare module 'virtual:graphweaver-user-supplied-custom-pages' {
	import { RouteObject } from '@exogee/graphweaver-admin-ui';
	import { JSX } from 'react';

	export interface NavLinkExport {
		name: string;
		route: string;
	}

	export interface CustomPagesExport {
		defaultRoute?: string;
		routes: () => RouteObject[] | Promise<RouteObject[]>;
		navLinks: () => NavLinkExport[] | Promise<NavLinkExport[]>;
		sidebarFooter: () => JSX.Element | null;
	}

	export const customPages: CustomPagesExport;
}
