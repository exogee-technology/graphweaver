import type { Meta, StoryObj } from '@storybook/react';
import { fn } from '@storybook/test';

import { Button } from './button';

// More on how to set up stories at: https://storybook.js.org/docs/writing-stories#default-export
const meta = {
	title: 'Components/Button',
	component: Button,
	parameters: {
		// Optional parameter to center the component in the Canvas. More info: https://storybook.js.org/docs/configure/story-layout
		layout: 'centered',
	},
	// This component will have an automatically generated Autodocs entry: https://storybook.js.org/docs/writing-docs/autodocs
	// More on argTypes: https://storybook.js.org/docs/api/argtypes
	argTypes: {
		disabled: { control: 'check' },
		loading: { control: 'check' },
		children: { control: 'text' },
	},
	// Use `fn` to spy on the onClick arg, which will appear in the actions panel once invoked: https://storybook.js.org/docs/essentials/actions#action-args
	args: { onClick: fn() },
} as Meta<typeof Button>;

export default meta;
type Story = StoryObj<typeof meta>;

// More on writing stories with args: https://storybook.js.org/docs/writing-stories/args
export const Default: Story = {
	args: {
		type: 'button',
		children: 'Click me!',
	},
};

export const Disabled: Story = {
	args: {
		disabled: true,
		children: 'You cannot click me!',
	},
};

export const Loading: Story = {
	args: {
		loading: true,
		children: 'Loading...',
	},
};
