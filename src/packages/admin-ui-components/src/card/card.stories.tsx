import type { Meta, StoryObj } from '@storybook/react';
import { Card } from './component';

// More on how to set up stories at: https://storybook.js.org/docs/writing-stories#default-export
const meta = {
	title: 'Layout/Card',
	component: Card,
	parameters: {
		// Optional parameter to center the component in the Canvas. More info: https://storybook.js.org/docs/configure/story-layout
		layout: 'centered',
	},
	// This component will have an automatically generated Autodocs entry: https://storybook.js.org/docs/writing-docs/autodocs
	// More on argTypes: https://storybook.js.org/docs/api/argtypes
	argTypes: {
		title: {
			control: 'text',
			description: 'The title displayed at the top of the card',
		},
		description: {
			control: 'text',
			description: 'A short description shown below the title',
		},
		children: {
			control: { type: 'text' },
			description: 'The content of the card',
		},
	},
} as Meta<typeof Card>;

export default meta;
type Story = StoryObj<typeof meta>;

// More on writing stories with args: https://storybook.js.org/docs/writing-stories/args
export const Default: Story = {
	args: {
		title: 'Card Title',
		description: 'This is a description for the card.',
		children: 'This is the main content of the card component.',
	},
	render: (args) => (
		<Card title={args.title} description={args.description}>
			{typeof args.children === 'string' ? <p>{args.children}</p> : args.children}
		</Card>
	),
};

export const TitleOnly: Story = {
	args: {
		title: 'Card with Title Only',
		children: 'This card has a title but no description.',
	},
	render: (args) => (
		<Card title={args.title}>
			{typeof args.children === 'string' ? <p>{args.children}</p> : args.children}
		</Card>
	),
};

export const DescriptionOnly: Story = {
	args: {
		description: 'This card has a description but no title.',
		children: 'This is the main content of the card.',
	},
	render: (args) => (
		<Card description={args.description}>
			{typeof args.children === 'string' ? <p>{args.children}</p> : args.children}
		</Card>
	),
};

export const ContentOnly: Story = {
	args: {
		children: 'Custom content only',
	},
	render: () => (
		<Card>
			<div>
				<h4>Custom Content</h4>
				<p>This card has only content with no title or description.</p>
				<button>Click me</button>
			</div>
		</Card>
	),
};

export const ComplexContent: Story = {
	args: {
		title: 'Card with Complex Content',
		description: 'This card contains more complex content elements.',
		children: 'Complex content placeholder',
	},
	render: (args) => (
		<Card title={args.title} description={args.description}>
			<div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
				<div style={{ border: '1px solid #3b3349', padding: '8px', borderRadius: '6px' }}>
					<p>This is a section with a border.</p>
				</div>
				<div style={{ display: 'flex', justifyContent: 'space-between' }}>
					<button>Cancel</button>
					<button>Save</button>
				</div>
			</div>
		</Card>
	),
};
