import React, { useState } from 'react';
import { Meta, StoryObj } from '@storybook/react';
import { Input } from './component';

const meta = {
	title: 'Components/Input',
	component: Input,
	parameters: {
		docs: {
			description: {
				component:
					'A reusable input component that supports various input types with consistent styling.',
			},
		},
	},
	argTypes: {
		type: {
			control: 'select',
			options: ['text', 'password', 'email', 'number', 'tel', 'url'],
			description: 'The type of input',
		},
		label: {
			control: 'text',
			description: 'Label text for the input',
		},
		placeholder: {
			control: 'text',
			description: 'Placeholder text',
		},
		required: {
			control: 'boolean',
			description: 'Whether the input is required',
		},
		disabled: {
			control: 'boolean',
			description: 'Whether the input is disabled',
		},
		error: {
			control: 'text',
			description: 'Error message text',
		},
		showPasswordToggle: {
			control: 'boolean',
			description: 'Whether to show the password toggle button (only for type="password")',
		},
		min: {
			control: 'number',
			description: 'Minimum value (only for type="number")',
		},
		max: {
			control: 'number',
			description: 'Maximum value (only for type="number")',
		},
		step: {
			control: 'number',
			description: 'Step value for increments (only for type="number")',
		},
	},
} as Meta<typeof Input>;

export default meta;
type Story = StoryObj<typeof meta>;

// Default text input
export const Text: Story = {
	args: {
		label: 'Username',
		placeholder: 'Enter your username',
		type: 'text',
	},
};

// Password input
export const Password: Story = {
	args: {
		label: 'Password',
		placeholder: 'Enter your password',
		type: 'password',
		showPasswordToggle: true,
	},
};

// Number input
export const Number: Story = {
	args: {
		label: 'Quantity',
		type: 'number',
		min: 0,
		max: 100,
		step: 1,
		defaultValue: '10',
	},
};

// Required input
export const Required: Story = {
	args: {
		label: 'Email',
		placeholder: 'Enter your email',
		type: 'email',
		required: true,
	},
};

// Disabled input
export const Disabled: Story = {
	args: {
		label: 'Username',
		placeholder: 'Enter your username',
		type: 'text',
		disabled: true,
		defaultValue: 'johndoe',
	},
};

// Input with error
export const WithError: Story = {
	args: {
		label: 'Email',
		placeholder: 'Enter your email',
		type: 'email',
		error: 'Please enter a valid email address',
		defaultValue: 'invalid-email',
	},
};

// Interactive controlled input example
export const Controlled = () => {
	const [value, setValue] = useState('');

	const handleChange = (newValue: string) => {
		setValue(newValue);
	};

	return (
		<div style={{ maxWidth: '300px' }}>
			<Input
				label="Controlled Input"
				placeholder="Type something..."
				value={value}
				onChange={handleChange}
			/>
			<div style={{ marginTop: '10px' }}>
				Current value: <code>{value}</code>
			</div>
		</div>
	);
};

// Form with multiple inputs
export const FormExample = () => {
	const [formValues, setFormValues] = useState({
		name: '',
		email: '',
		password: '',
		age: '25',
	});

	const handleChange = (field: string) => (value: string) => {
		setFormValues({
			...formValues,
			[field]: value,
		});
	};

	return (
		<div style={{ maxWidth: '400px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
			<Input
				label="Full Name"
				placeholder="Enter your full name"
				value={formValues.name}
				onChange={handleChange('name')}
				required
			/>

			<Input
				label="Email Address"
				placeholder="Enter your email"
				type="email"
				value={formValues.email}
				onChange={handleChange('email')}
				required
			/>

			<Input
				label="Password"
				placeholder="Create a password"
				type="password"
				value={formValues.password}
				onChange={handleChange('password')}
				required
			/>

			<Input
				label="Age"
				type="number"
				min={18}
				max={120}
				value={formValues.age}
				onChange={handleChange('age')}
			/>

			<button
				style={{
					padding: '8px 16px',
					backgroundColor: '#6200ee',
					color: 'white',
					border: 'none',
					borderRadius: '4px',
					cursor: 'pointer',
					marginTop: '8px',
				}}
			>
				Submit
			</button>
		</div>
	);
};
