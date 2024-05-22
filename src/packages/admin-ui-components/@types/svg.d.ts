// Sourced from https://github.com/pd4d10/vite-plugin-svgr/blob/main/client.d.ts
// We didn't use `types:
declare module '*.svg?react' {
	import * as React from 'react';

	const ReactComponent: React.FunctionComponent<React.ComponentProps<'svg'> & { title?: string }>;

	export default ReactComponent;
}
