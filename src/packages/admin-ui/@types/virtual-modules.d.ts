declare module 'virtual:graphweaver-user-supplied-dashboards' {
	import { RouteObject } from 'react-router-dom';

	export interface NavLinkExport {
		name: string;
		route: string;
	}

	export interface DashboardExport {
		routes: () => RouteObject[] | Promise<RouteObject[]>;
		navLinks: () => NavLinkExport[] | Promise<NavLinkExport[]>;
	}

	export const dashboards: DashboardExport[];
}
