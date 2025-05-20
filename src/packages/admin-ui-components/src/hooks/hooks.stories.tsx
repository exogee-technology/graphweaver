import { Meta } from '@storybook/react';

/**
 * This file doesn't contain actual stories but serves as documentation for hooks.
 * Hooks cannot be rendered directly as components, but we can show example usage.
 */
const meta = {
	title: 'Hooks/Overview',
	parameters: {
		docs: {
			description: {
				component: 'Documentation for React hooks available in the admin-ui-components package.',
			},
		},
	},
} as Meta;

export default meta;

// This is a dummy component just for documentation purposes
export const HooksDocs = () => {
	return (
		<div>
			<p>
				The <code>@exogee/graphweaver-admin-ui-components</code> package provides several custom
				React hooks to help with common UI patterns. See the documentation for details on each hook.
			</p>
		</div>
	);
};

HooksDocs.parameters = {
	docs: {
		source: {
			code: null,
		},
	},
};
