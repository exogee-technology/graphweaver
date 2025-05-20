import React from 'react';
import { Meta, StoryObj } from '@storybook/react';
import { DetailPanel } from './component';

/**
 * Note: This is a complex component that depends on many parts of the application.
 * It's tightly integrated with the application context, routing, and data fetching.
 * Due to these dependencies, we'll provide a documentation-only story.
 */
const meta = {
	title: 'Components/DetailPanel',
	component: DetailPanel,
	parameters: {
		layout: 'fullscreen',
		docs: {
			description: {
				component:
					'The DetailPanel provides a form interface for editing entity details or creating new entities.',
			},
		},
		// Disable the controls since we're using this as documentation-only
		controls: { disable: true },
	},
} as Meta<typeof DetailPanel>;

export default meta;
type Story = StoryObj<typeof meta>;

// Mock component to avoid rendering the actual DetailPanel which requires Apollo Client
const MockDetailPanel = () => (
	<div
		style={{
			border: '1px solid #ccc',
			borderRadius: '4px',
			padding: '20px',
			maxWidth: '600px',
		}}
	>
		<h3>DetailPanel Preview (Mock)</h3>
		<p>This is a mock representation of the DetailPanel component.</p>
		<p>
			The actual component requires Apollo Client and other application context to render properly.
		</p>
		<p>Please refer to the documentation for usage details.</p>
	</div>
);

// Documentation-only story with detailed explanation and mock component
export const Documentation: Story = {
	render: () => <MockDetailPanel />,
	parameters: {
		docs: {
			description: {
				story: `
# DetailPanel Component

The DetailPanel is a slide-in panel that provides a form interface for editing entity details or creating new entities. It displays fields based on the entity's metadata, handles form validation, and submits changes to the server.

## Features

- **Edit Mode**: Displays and edits existing entity data
- **Create Mode**: Provides a form for creating new entities
- **Field Type Handling**: Renders appropriate inputs based on field types (string, number, boolean, etc.)
- **Validation**: Validates required fields and field formats
- **Animation**: Slides in and out with a smooth animation
- **Responsive**: Adapts to different screen sizes
- **Session Storage**: Preserves form state across navigation

## Visual Appearance

The DetailPanel appears as a slide-in panel from the right side of the screen. It contains:

1. A form with fields based on the entity's metadata
2. Input types appropriate for each field's data type
3. Required field indicators
4. Save and Cancel buttons at the bottom
5. Validation error messages (displayed as toasts)

## Implementation

This component is typically used within a routing context and depends on:

\`\`\`jsx
<ErrorBoundary FallbackComponent={DefaultErrorFallback}>
	<WouterRouter base={import.meta.env.VITE_ADMIN_UI_BASE}>
		<Switch>
			{/* Other routes */}
			<Route path="/:entity/:id?">
				<DefaultLayout>
					<List>
						<Route path="/:entity/:id">
							<DetailPanel />
						</Route>
					</List>
				</DefaultLayout>
			</Route>
		</Switch>
	</WouterRouter>
</ErrorBoundary>
\`\`\`

## Usage Contexts

1. **Editing Entities**: Navigate to an entity list and click an item to edit it
2. **Creating Entities**: Click the "Add" button in an entity list to create a new entity

## Dependencies

The DetailPanel relies on:

- Apollo Client for GraphQL data fetching and mutations
- Wouter for routing and URL parameter handling
- Formik for form state management and validation
- React hooks for state management
- Custom hooks from the utils module for schema and entity information
`,
			},
		},
	},
};
