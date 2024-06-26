import type { ReactNode } from 'react';

export interface CustomNavLinkConfiguration {
	name: string;
	route: string;
}

export interface CustomRouteConfiguration {
	path: string;
	element: ReactNode;
}

export interface CustomPageConfiguration {
	defaultRoute?: string;
	navLinks?: () => CustomNavLinkConfiguration[] | Promise<CustomNavLinkConfiguration[]>;
	routes?: () => CustomRouteConfiguration[] | Promise<CustomRouteConfiguration[]>;
}
