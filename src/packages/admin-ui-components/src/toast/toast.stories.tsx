import type { Meta, StoryObj } from '@storybook/react';
import { useEffect } from 'react';
import { toast as hotToast } from 'react-hot-toast';
import { DismissibleToast, toast } from './component';

// Create a mock toast component for display in Storybook
const ToastDemo = ({
	type = 'success',
	message = 'This is a toast message',
	autoTrigger = false,
	duration = 500000, // Long duration to keep it visible in Storybook
}) => {
	useEffect(() => {
		// Only show toast when autoTrigger is true
		if (autoTrigger) {
			if (type === 'success') {
				toast.success(message, { duration });
			} else if (type === 'error') {
				toast.error(message, { duration });
			} else if (type === 'loading') {
				toast.loading(message, { duration });
			}
		}
	}, [type, message, autoTrigger, duration]);

	return (
		<div style={{ height: '200px', width: '100%' }}>
			<DismissibleToast />

			{/* Add buttons to manually trigger toasts */}
			{!autoTrigger && (
				<div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
					<button
						onClick={() => toast.success('Operation completed successfully!', { duration })}
						style={{
							padding: '8px 16px',
							background: '#271f36',
							color: '#e0dde5',
							border: '1px solid rgba(255, 255, 255, 0.1)',
							borderRadius: '6px',
							cursor: 'pointer',
						}}
					>
						Show Success Toast
					</button>

					<button
						onClick={() => toast.error('Something went wrong. Please try again.', { duration })}
						style={{
							padding: '8px 16px',
							background: '#271f36',
							color: '#e0dde5',
							border: '1px solid rgba(255, 255, 255, 0.1)',
							borderRadius: '6px',
							cursor: 'pointer',
						}}
					>
						Show Error Toast
					</button>

					<button
						onClick={() => toast.loading('Loading your data...', { duration })}
						style={{
							padding: '8px 16px',
							background: '#271f36',
							color: '#e0dde5',
							border: '1px solid rgba(255, 255, 255, 0.1)',
							borderRadius: '6px',
							cursor: 'pointer',
						}}
					>
						Show Loading Toast
					</button>

					<button
						onClick={() => hotToast.dismiss()}
						style={{
							padding: '8px 16px',
							background: '#271f36',
							color: '#e0dde5',
							border: '1px solid rgba(255, 255, 255, 0.1)',
							borderRadius: '6px',
							cursor: 'pointer',
						}}
					>
						Dismiss All
					</button>
				</div>
			)}
		</div>
	);
};

const meta = {
	title: 'Display/Toast',
	component: ToastDemo,
	parameters: {
		layout: 'padded',
	},
	argTypes: {
		type: {
			control: 'select',
			options: ['success', 'error', 'loading'],
		},
		message: { control: 'text' },
		autoTrigger: { control: 'boolean' },
	},
} as Meta<typeof ToastDemo>;

export default meta;
type Story = StoryObj<typeof meta>;

// Interactive Demo
export const Interactive: Story = {
	args: {
		autoTrigger: false,
	},
};

// Success Toast
export const Success: Story = {
	args: {
		type: 'success',
		message: 'Operation completed successfully!',
		autoTrigger: true,
	},
};

// Error Toast
export const Error: Story = {
	args: {
		type: 'error',
		message: 'Something went wrong. Please try again.',
		autoTrigger: true,
	},
};

// Loading Toast
export const Loading: Story = {
	args: {
		type: 'loading',
		message: 'Loading your data...',
		autoTrigger: true,
	},
};

// Multiple Toasts
export const Multiple: Story = {
	render: () => {
		useEffect(() => {
			// Simulate multiple toasts
			const showToasts = () => {
				toast.success('User profile updated successfully!');
				setTimeout(() => toast.error('Failed to save preferences.'), 300);
				setTimeout(() => toast.loading('Synchronizing data...'), 600);
			};

			// Show toasts after a brief delay
			const timer = setTimeout(showToasts, 300);

			return () => clearTimeout(timer);
		}, []);

		return <ToastDemo autoTrigger={false} />;
	},
};
