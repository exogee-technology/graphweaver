import React from 'react';
import { Meta, StoryObj } from '@storybook/react';
import { createForm } from './component';
import { z } from 'zod';
import { SelectMode } from '../select';

// This is a wrapper component to demonstrate the createForm hook
function FormDemoWrapper({ zodSchema, cols = 1 }: { zodSchema?: boolean; cols?: number }) {
	const { Form, Field, canSubmit } = createForm({
		defaultValues: {
			name: '',
			email: '',
			age: 25,
			isActive: true,
			subscription: null,
			interests: [],
		},
		zodSchema: zodSchema
			? z.object({
					name: z.string().min(2, 'Name must be at least 2 characters'),
					email: z.string().email('Invalid email address'),
					age: z.number().min(18, 'Must be at least 18 years old'),
					isActive: z.boolean(),
					subscription: z.string().nullable(),
					interests: z.array(z.string()),
				})
			: undefined,
		onSubmit: (values) => {
			alert(JSON.stringify(values, null, 2));
			return values;
		},
		cols,
	});

	return (
		<div style={{ maxWidth: '800px' }}>
			<Form>
				<Field name="name" type="text" label="Name" placeholder="Enter your name" />

				<Field
					name="email"
					type="text"
					label="Email Address"
					placeholder="email@example.com"
					span={cols > 1 ? 2 : 1}
				/>

				<Field name="age" type="number" label="Age" min={0} max={120} />

				<Field
					name="subscription"
					type="select"
					label="Subscription Type"
					options={[
						{ value: 'free', label: 'Free' },
						{ value: 'basic', label: 'Basic' },
						{ value: 'premium', label: 'Premium' },
					]}
					placeholder="Select a subscription"
				/>

				<Field
					name="interests"
					type="select"
					label="Interests"
					mode={SelectMode.MULTI}
					options={[
						{ value: 'sports', label: 'Sports' },
						{ value: 'music', label: 'Music' },
						{ value: 'reading', label: 'Reading' },
						{ value: 'travel', label: 'Travel' },
						{ value: 'food', label: 'Food & Cooking' },
					]}
					placeholder="Select your interests"
				/>

				<Field name="isActive" type="switch" label="Active Status" />

				<div style={{ marginTop: '20px', gridColumn: '1 / -1' }}>
					<button
						type="submit"
						disabled={zodSchema && !canSubmit}
						style={{
							padding: '8px 16px',
							backgroundColor: '#6200ee',
							color: 'white',
							border: 'none',
							borderRadius: '4px',
							cursor: canSubmit ? 'pointer' : 'not-allowed',
							opacity: canSubmit ? 1 : 0.6,
						}}
					>
						Submit
					</button>
				</div>
			</Form>
		</div>
	);
}

// Wrapper component for documentation purposes
const FormWrapper = (props: any) => {
	return <FormDemoWrapper {...props} />;
};

const meta = {
	title: 'Components/Form',
	component: FormWrapper,
	parameters: {
		docs: {
			description: {
				component:
					'A form creation hook that returns form components with built-in validation, state management, and styling.',
			},
		},
	},
	argTypes: {
		zodSchema: {
			control: 'boolean',
			description: 'Enable Zod schema validation',
			defaultValue: true,
		},
		cols: {
			control: { type: 'number', min: 1, max: 3 },
			description: 'Number of columns in the form layout',
			defaultValue: 1,
		},
	},
} as Meta<typeof FormWrapper>;

export default meta;
type Story = StoryObj<typeof meta>;

// Basic form with validation
export const WithValidation: Story = {
	args: {
		zodSchema: true,
		cols: 1,
	},
};

// Form with multiple columns
export const MultiColumnLayout: Story = {
	args: {
		zodSchema: true,
		cols: 2,
	},
};

// Form without validation
export const WithoutValidation: Story = {
	args: {
		zodSchema: false,
		cols: 1,
	},
};
