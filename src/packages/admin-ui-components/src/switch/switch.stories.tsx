import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { Switch } from './component';

const meta = {
	title: 'Inputs/Switch',
	component: Switch,
	parameters: {
		layout: 'centered',
	},
	argTypes: {
		label: { control: 'text' },
		checked: { control: 'boolean' },
		disabled: { control: 'boolean' },
		defaultChecked: { control: 'boolean' },
		onChange: { action: 'changed' },
	},
	decorators: [(Story) => <div style={{ padding: '1rem' }}>{Story()}</div>],
} as Meta<typeof Switch>;

export default meta;
type Story = StoryObj<typeof meta>;

// Basic switch
export const Default: Story = {
	args: {
		label: 'Toggle me',
	},
};

// Switch that's checked by default
export const DefaultChecked: Story = {
	args: {
		label: 'Enabled by default',
		defaultChecked: true,
	},
};

// Disabled switch
export const Disabled: Story = {
	args: {
		label: 'Disabled switch',
		disabled: true,
	},
};

// Disabled and checked switch
export const DisabledChecked: Story = {
	args: {
		label: 'Disabled checked switch',
		disabled: true,
		defaultChecked: true,
	},
};

// Component for Controlled story
const ControlledSwitch = () => {
	const [checked, setChecked] = useState(false);
	return (
		<div
			style={{ display: 'flex', flexDirection: 'column', gap: '10px', alignItems: 'flex-start' }}
		>
			<Switch
				label="Controlled switch"
				checked={checked}
				onChange={(newChecked) => setChecked(newChecked)}
			/>
			<div style={{ fontSize: '14px', color: '#e0dde5' }}>
				Current state: {checked ? 'On' : 'Off'}
			</div>
		</div>
	);
};

// Controlled switch
export const Controlled: Story = {
	render: () => <ControlledSwitch />,
};

// No label
export const NoLabel: Story = {
	args: {},
};

// Switch with long label
export const LongLabel: Story = {
	args: {
		label:
			'This is a switch with a very long label that might wrap to multiple lines depending on the container width',
	},
};

// Multiple switches
export const MultipleOptions: Story = {
	render: () => {
		return (
			<div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
				<Switch label="Enable notifications" defaultChecked={true} />
				<Switch label="Dark mode" />
				<Switch label="Auto-update" />
				<Switch label="Sound effects" defaultChecked={true} />
			</div>
		);
	},
};

// Component for InForm story
const SwitchInForm = () => {
	const [formData, setFormData] = useState({ notifications: true, darkMode: false });
	const [submitted, setSubmitted] = useState(false);

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		setSubmitted(true);
		// In a real app, you would submit the form data here
		console.log('Form submitted with:', formData);
	};

	return (
		<div style={{ minWidth: '300px' }}>
			<form
				onSubmit={handleSubmit}
				style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}
			>
				<Switch
					label="Enable notifications"
					name="notifications"
					checked={formData.notifications}
					onChange={(checked) => setFormData({ ...formData, notifications: checked })}
				/>
				<Switch
					label="Dark mode"
					name="darkMode"
					checked={formData.darkMode}
					onChange={(checked) => setFormData({ ...formData, darkMode: checked })}
				/>
				<button
					type="submit"
					style={{
						padding: '8px 16px',
						background: '#7C5DC7',
						color: 'white',
						border: 'none',
						borderRadius: '4px',
						cursor: 'pointer',
						marginTop: '10px',
					}}
				>
					Save Settings
				</button>

				{submitted && (
					<div
						style={{
							marginTop: '10px',
							padding: '10px',
							background: 'rgba(124, 93, 199, 0.1)',
							borderRadius: '4px',
						}}
					>
						<p style={{ fontSize: '14px', color: '#e0dde5', margin: 0 }}>Form submitted with:</p>
						<pre style={{ fontSize: '12px', color: '#e0dde5', margin: 0 }}>
							{JSON.stringify(formData, null, 2)}
						</pre>
					</div>
				)}
			</form>
		</div>
	);
};

// Switch with form integration
export const InForm: Story = {
	render: () => <SwitchInForm />,
};
