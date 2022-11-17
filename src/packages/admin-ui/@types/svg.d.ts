import React from 'react';

declare module '*.svg' {
	export const ReactComponent: React.ComponentClass<
		React.FunctionComponent<React.SVGProps<SVGSVGElement>>,
		any
	>;
}
