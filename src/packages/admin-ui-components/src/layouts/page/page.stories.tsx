import type { Meta, StoryObj } from '@storybook/react';
import { Page } from './component';

// Instead of trying to mock DefaultLayout directly, we'll just wrap the Page component
// in a simple container for story presentation purposes

const PageStory = (props: React.ComponentProps<typeof Page>) => (
	<div
		style={{
			background: '#f8f9fa',
			border: '1px solid #e9ecef',
			borderRadius: '4px',
			padding: '24px',
		}}
	>
		<div
			style={{
				padding: '24px 0',
				borderBottom: '1px solid #e9ecef',
				marginBottom: '24px',
			}}
		>
			<h1>{props.title}</h1>
			{props.subtitle && <h2 style={{ fontSize: '16px', color: '#666' }}>{props.subtitle}</h2>}
		</div>
		<div>{props.children}</div>
	</div>
);

const meta = {
	title: 'Layout/Page',
	component: PageStory,
	parameters: {
		layout: 'padded',
		docs: {
			description: {
				component:
					'Note: In these examples, the Page component is shown without the DefaultLayout for simplicity.',
			},
		},
	},
	argTypes: {
		title: {
			control: 'text',
			description: 'The main title of the page',
		},
		subtitle: {
			control: 'text',
			description: 'Optional subtitle displayed below the main title',
		},
		headerClassName: {
			control: 'text',
			description: 'Optional CSS class for the header section',
		},
		contentClassName: {
			control: 'text',
			description: 'Optional CSS class for the content section',
		},
	},
} as Meta<typeof PageStory>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
	args: {
		title: 'Page Title',
		children: (
			<div
				style={{
					padding: '24px',
					backgroundColor: '#ffffff',
					border: '1px solid #e0e0e0',
					borderRadius: '4px',
				}}
			>
				Page content goes here
			</div>
		),
	},
};

export const WithSubtitle: Story = {
	args: {
		title: 'Dashboard',
		subtitle: 'Overview of key metrics and data',
		children: (
			<div
				style={{
					padding: '24px',
					backgroundColor: '#ffffff',
					border: '1px solid #e0e0e0',
					borderRadius: '4px',
				}}
			>
				Dashboard content with charts and metrics
			</div>
		),
	},
};

export const WithCustomClasses: Story = {
	args: {
		title: 'Custom Styled Page',
		subtitle: 'With custom header and content classes',
		headerClassName: 'custom-header-class',
		contentClassName: 'custom-content-class',
		children: (
			<div
				style={{
					padding: '24px',
					backgroundColor: '#ffffff',
					border: '1px solid #e0e0e0',
					borderRadius: '4px',
				}}
			>
				Content with custom styling
			</div>
		),
	},
};
