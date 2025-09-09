import { Meta, StoryObj } from '@storybook/react-vite';
import { Form, Formik } from 'formik';
import { ApolloProvider } from '@apollo/client';
import { Router } from 'wouter';
import { AdminUIFilterType, DetailPanelInputComponentOption, Entity, EntityField } from '../utils';
import { DetailPanel } from './component';
import { apolloClient } from '../apollo';

// Import field components for rendering
import {
	BooleanField,
	DateField,
	EnumField,
	JSONField,
	LinkField,
	MediaField,
	RelationshipField,
	RelationshipCountField,
	RichTextField,
	TextField,
} from './fields';

// Mock enum for enum field
const mockEnum = {
	name: 'Status',
	values: [
		{ name: 'ACTIVE', value: 'ACTIVE' },
		{ name: 'INACTIVE', value: 'INACTIVE' },
		{ name: 'PENDING', value: 'PENDING' },
	],
};

// Mock schema provider component
const MockSchemaProvider = ({ children }: { children: React.ReactNode }) => {
	// This would normally be provided by a context, but for storybook we'll mock it
	return <div data-testid="mock-schema-provider">{children}</div>;
};

// Mock entity for the fields
const mockEntity: Entity = {
	name: 'User',
	fields: [],
	plural: 'Users',
	primaryKeyField: 'id',
	fieldForDetailPanelNavigationId: 'id',
	supportedAggregationTypes: [],
	supportsPseudoCursorPagination: false,
	hideInSideBar: false,
	attributes: {
		isReadOnly: false,
		exportPageSize: 100,
		clientGeneratedPrimaryKeys: false,
	},
};

// Mock field definitions
const mockFields: EntityField[] = [
	{
		name: 'id',
		type: 'ID!',
		attributes: { isReadOnly: true, isRequiredForCreate: false, isRequiredForUpdate: true },
	},
	{
		name: 'name',
		type: 'String',
		attributes: { isReadOnly: false, isRequiredForCreate: true, isRequiredForUpdate: false },
	},
	{
		name: 'age',
		type: 'Number',
		attributes: { isReadOnly: false, isRequiredForCreate: false, isRequiredForUpdate: false },
	},
	{
		name: 'active',
		type: 'Boolean',
		attributes: { isReadOnly: false, isRequiredForCreate: false, isRequiredForUpdate: false },
	},
	{
		name: 'dateOfBirth',
		type: 'Date',
		attributes: { isReadOnly: false, isRequiredForCreate: false, isRequiredForUpdate: false },
	},
	{
		name: 'createdAt',
		type: 'DateScalar',
		attributes: { isReadOnly: false, isRequiredForCreate: false, isRequiredForUpdate: false },
	},
	{
		name: 'status',
		type: 'Status',
		attributes: { isReadOnly: false, isRequiredForCreate: false, isRequiredForUpdate: false },
	},
	{
		name: 'metadata',
		type: 'JSON',
		attributes: { isReadOnly: false, isRequiredForCreate: false, isRequiredForUpdate: false },
	},
	{
		name: 'avatar',
		type: 'GraphweaverMedia',
		attributes: { isReadOnly: false, isRequiredForCreate: false, isRequiredForUpdate: false },
	},
	{
		name: 'bio',
		type: 'String',
		attributes: { isReadOnly: false, isRequiredForCreate: false, isRequiredForUpdate: false },
		detailPanelInputComponent: {
			name: DetailPanelInputComponentOption.RICH_TEXT,
			options: {},
		},
	},
	{
		name: 'notes',
		type: 'String',
		attributes: { isReadOnly: false, isRequiredForCreate: false, isRequiredForUpdate: false },
		detailPanelInputComponent: {
			name: DetailPanelInputComponentOption.MARKDOWN,
			options: {},
		},
	},
	{
		name: 'company',
		type: 'Company',
		relationshipType: 'MANY_TO_ONE',
		attributes: { isReadOnly: false, isRequiredForCreate: false, isRequiredForUpdate: false },
	},
	{
		name: 'companyReadOnly',
		type: 'Company',
		relationshipType: 'MANY_TO_ONE',
		attributes: { isReadOnly: true, isRequiredForCreate: false, isRequiredForUpdate: false },
	},
	{
		name: 'ordersCount',
		type: 'Order',
		relationshipType: 'ONE_TO_MANY',
		relationshipBehaviour: 'count',
		attributes: { isReadOnly: true, isRequiredForCreate: false, isRequiredForUpdate: false },
	},
];

// Mock function to render a field
const renderField = (field: EntityField, autoFocus = false) => {
	const panelMode = { CREATE: 'CREATE', EDIT: 'EDIT' };

	const getField = ({
		entity,
		field,
		autoFocus,
	}: {
		entity: Entity;
		field: EntityField;
		autoFocus: boolean;
		panelMode: string;
	}) => {
		const isReadonly = field.attributes?.isReadOnly || false;

		if (field.type === 'JSON') {
			return <JSONField name={field.name} autoFocus={autoFocus} disabled={isReadonly} />;
		}

		if (field.type === 'Boolean') {
			return <BooleanField field={field} autoFocus={autoFocus} disabled={isReadonly} />;
		}

		if (field.type === 'Date' || field.type === 'DateScalar') {
			return (
				<DateField
					field={field}
					filterType={
						field.type === 'DateScalar'
							? AdminUIFilterType.DATE_RANGE
							: AdminUIFilterType.DATE_TIME_RANGE
					}
					fieldType={field.type}
				/>
			);
		}

		if (field.type === 'GraphweaverMedia') {
			return <MediaField field={field} autoFocus={autoFocus} />;
		}

		if (field.relationshipType) {
			// If the field is readonly and a relationship, show a link to the entity/entities
			if (isReadonly) {
				// For relationships with 'count' behaviour, show count field instead of link
				if (field.relationshipBehaviour === 'count') {
					return (
						<ApolloProvider client={apolloClient}>
							<Router>
								<MockSchemaProvider>
									<RelationshipCountField name={field.name} field={field} entity={entity} />
								</MockSchemaProvider>
							</Router>
						</ApolloProvider>
					);
				}
				return <LinkField name={field.name} field={field} />;
			} else {
				return <RelationshipField name={field.name} field={field} autoFocus={autoFocus} />;
			}
		}

		// Mock enum handling
		if (field.type === 'Status') {
			return (
				<EnumField
					name={field.name}
					typeEnum={mockEnum}
					multiple={field.isArray}
					autoFocus={autoFocus}
					disabled={isReadonly}
				/>
			);
		}

		if (
			field.detailPanelInputComponent?.name === DetailPanelInputComponentOption.RICH_TEXT ||
			field.detailPanelInputComponent?.name === DetailPanelInputComponentOption.MARKDOWN
		) {
			return (
				<RichTextField
					key={field.name}
					field={field}
					isReadOnly={!!isReadonly}
					options={field.detailPanelInputComponent?.options ?? {}}
					asMarkdown={
						field.detailPanelInputComponent?.name === DetailPanelInputComponentOption.MARKDOWN
					}
				/>
			);
		}

		const fieldType = field.type === 'Number' ? 'number' : 'text';

		return (
			<TextField name={field.name} type={fieldType} disabled={isReadonly} autoFocus={autoFocus} />
		);
	};

	return (
		<Formik
			initialValues={{
				[field.name]: field.type === 'Boolean' ? false : field.type === 'Number' ? 0 : '',
			}}
			onSubmit={() => {}}
		>
			<Form>
				<div style={{ padding: '20px', maxWidth: '400px' }}>
					<div style={{ marginBottom: '16px' }}>
						<label style={{ display: 'block', fontWeight: 'bold', marginBottom: '8px' }}>
							{field.name} ({field.type})
						</label>
						{getField({ entity: mockEntity, field, autoFocus, panelMode: panelMode.EDIT })}
					</div>
				</div>
			</Form>
		</Formik>
	);
};

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

// Individual field stories
export const StringField: Story = {
	render: () => renderField(mockFields.find((f) => f.name === 'name')!),
	parameters: {
		docs: {
			description: {
				story: 'String field with text input',
			},
		},
	},
};

export const NumberField: Story = {
	render: () => renderField(mockFields.find((f) => f.name === 'age')!),
	parameters: {
		docs: {
			description: {
				story: 'Number field with numeric input',
			},
		},
	},
};

export const BooleanFieldStory: Story = {
	render: () => renderField(mockFields.find((f) => f.name === 'active')!),
	parameters: {
		docs: {
			description: {
				story: 'Boolean field with checkbox input',
			},
		},
	},
};

export const DateFieldStory: Story = {
	render: () => renderField(mockFields.find((f) => f.name === 'dateOfBirth')!),
	parameters: {
		docs: {
			description: {
				story: 'Date field with date picker',
			},
		},
	},
};

export const DateScalarFieldStory: Story = {
	render: () => renderField(mockFields.find((f) => f.name === 'createdAt')!),
	parameters: {
		docs: {
			description: {
				story: 'Date scalar field with date range picker',
			},
		},
	},
};

export const EnumFieldStory: Story = {
	render: () => renderField(mockFields.find((f) => f.name === 'status')!),
	parameters: {
		docs: {
			description: {
				story: 'Enum field with dropdown selection',
			},
		},
	},
};

export const JSONFieldStory: Story = {
	render: () => renderField(mockFields.find((f) => f.name === 'metadata')!),
	parameters: {
		docs: {
			description: {
				story: 'JSON field with JSON editor',
			},
		},
	},
};

export const RichTextFieldStory: Story = {
	render: () => renderField(mockFields.find((f) => f.name === 'bio')!),
	parameters: {
		docs: {
			description: {
				story: 'Rich text field with WYSIWYG editor',
			},
		},
	},
};

export const MarkdownFieldStory: Story = {
	render: () => renderField(mockFields.find((f) => f.name === 'notes')!),
	parameters: {
		docs: {
			description: {
				story: 'Markdown field with markdown editor',
			},
		},
	},
};

export const LinkFieldStory: Story = {
	render: () => renderField(mockFields.find((f) => f.name === 'companyReadOnly')!),
	parameters: {
		docs: {
			description: {
				story: 'Link field for read-only relationships',
			},
		},
	},
};

export const RelationshipCountFieldStory: Story = {
	render: () => renderField(mockFields.find((f) => f.name === 'ordersCount')!),
	parameters: {
		docs: {
			description: {
				story: 'Relationship count field for read-only ONE_TO_MANY relationships',
			},
		},
	},
};

export const AllFields: Story = {
	render: () => (
		<div
			style={{
				display: 'grid',
				gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))',
				gap: '20px',
				padding: '20px',
			}}
		>
			{mockFields.map((field) => (
				<div
					key={field.name}
					style={{ border: '1px solid #eee', borderRadius: '4px', padding: '16px' }}
				>
					{renderField(field)}
				</div>
			))}
		</div>
	),
	parameters: {
		docs: {
			description: {
				story: 'All available field types rendered together',
			},
		},
	},
};
