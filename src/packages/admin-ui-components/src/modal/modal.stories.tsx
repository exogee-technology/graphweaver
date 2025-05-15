import React, { useState } from 'react';
import { Meta, StoryObj } from '@storybook/react';
import { Modal } from './component';
import { Button } from '../button';

const meta = {
	title: 'Components/Modal',
	component: Modal,
	parameters: {
		docs: {
			description: {
				component:
					'A customizable modal dialog component for displaying content in a focused overlay.',
			},
		},
	},
	argTypes: {
		isOpen: {
			control: 'boolean',
			description: 'Controls whether the modal is visible',
		},
		onRequestClose: {
			action: 'closed',
			description: 'Function called when the modal should close',
		},
		title: {
			control: 'text',
			description: 'Title text or element to display in the modal header',
		},
		modalContent: {
			description: 'Content to display in the main section of the modal',
		},
		footerContent: {
			description: 'Content to display in the footer section of the modal',
		},
		hideCloseX: {
			control: 'boolean',
			description: 'Whether to hide the close (X) button',
		},
		fullScreen: {
			control: 'boolean',
			description: 'Whether the modal should take up the full screen',
		},
		shouldCloseOnOverlayClick: {
			control: 'boolean',
			description: 'Whether clicking the overlay should close the modal',
		},
		shouldCloseOnEsc: {
			control: 'boolean',
			description: 'Whether pressing Escape should close the modal',
		},
		overlay: {
			control: 'boolean',
			description: 'Whether to show a semi-transparent overlay behind the modal',
		},
	},
} as Meta<typeof Modal>;

export default meta;
type Story = StoryObj<typeof meta>;

// Basic modal example with title and content
export const Default: Story = {
	args: {
		isOpen: true,
		title: 'Modal Title',
		modalContent: (
			<div style={{ padding: '20px', minHeight: '150px' }}>
				<p>This is a simple modal dialog with some content.</p>
				<p>You can put any React components inside the modal content.</p>
			</div>
		),
	},
};

// Modal with interactive controls
export const Interactive = () => {
	const [isOpen, setIsOpen] = useState(false);

	return (
		<div>
			<Button onClick={() => setIsOpen(true)}>Open Modal</Button>
			<Modal
				isOpen={isOpen}
				onRequestClose={() => setIsOpen(false)}
				title="Interactive Modal"
				modalContent={
					<div style={{ padding: '20px', minHeight: '150px' }}>
						<p>This modal can be opened and closed with the button.</p>
						<p>You can also close it by clicking the X button.</p>
					</div>
				}
				shouldCloseOnEsc={true}
				shouldCloseOnOverlayClick={true}
			/>
		</div>
	);
};

// Modal with custom footer
export const WithFooter = () => {
	const [isOpen, setIsOpen] = useState(false);

	return (
		<div>
			<Button onClick={() => setIsOpen(true)}>Open Modal with Footer</Button>
			<Modal
				isOpen={isOpen}
				onRequestClose={() => setIsOpen(false)}
				title="Modal with Footer"
				modalContent={
					<div style={{ padding: '20px', minHeight: '100px' }}>
						<p>This modal includes a footer with action buttons.</p>
					</div>
				}
				footerContent={
					<div
						style={{
							padding: '15px 20px',
							display: 'flex',
							justifyContent: 'flex-end',
							gap: '10px',
						}}
					>
						<Button onClick={() => setIsOpen(false)}>Cancel</Button>
						<Button
							onClick={() => {
								alert('Action confirmed!');
								setIsOpen(false);
							}}
						>
							Confirm
						</Button>
					</div>
				}
			/>
		</div>
	);
};

// Modal without a close button
export const WithoutCloseButton = () => {
	const [isOpen, setIsOpen] = useState(false);

	return (
		<div>
			<Button onClick={() => setIsOpen(true)}>Open Modal (No Close Button)</Button>
			<Modal
				isOpen={isOpen}
				onRequestClose={() => setIsOpen(false)}
				title="No Close Button"
				hideCloseX={true}
				modalContent={
					<div
						style={{
							padding: '20px',
							minHeight: '150px',
							display: 'flex',
							flexDirection: 'column',
							gap: '20px',
						}}
					>
						<p>This modal doesn't have a close button in the header.</p>
						<p>You must provide an alternative way to close it:</p>
						<Button onClick={() => setIsOpen(false)}>Close Modal</Button>
					</div>
				}
			/>
		</div>
	);
};

// Full screen modal
export const FullScreen = () => {
	const [isOpen, setIsOpen] = useState(false);

	return (
		<div>
			<Button onClick={() => setIsOpen(true)}>Open Full Screen Modal</Button>
			<Modal
				isOpen={isOpen}
				onRequestClose={() => setIsOpen(false)}
				title="Full Screen Modal"
				fullScreen={true}
				modalContent={
					<div
						style={{
							padding: '20px',
							display: 'flex',
							flexDirection: 'column',
							alignItems: 'center',
							justifyContent: 'center',
							height: '100%',
						}}
					>
						<h2>Full Screen Experience</h2>
						<p>This modal takes up the entire screen for an immersive experience.</p>
						<div style={{ marginTop: '40px' }}>
							<Button onClick={() => setIsOpen(false)}>Close</Button>
						</div>
					</div>
				}
			/>
		</div>
	);
};

// Form in a modal
export const FormModal = () => {
	const [isOpen, setIsOpen] = useState(false);
	const [formData, setFormData] = useState({
		name: '',
		email: '',
	});

	const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const { name, value } = e.target;
		setFormData((prev) => ({ ...prev, [name]: value }));
	};

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		alert(`Form submitted with: ${JSON.stringify(formData)}`);
		setIsOpen(false);
	};

	return (
		<div>
			<Button onClick={() => setIsOpen(true)}>Open Form Modal</Button>
			<Modal
				isOpen={isOpen}
				onRequestClose={() => setIsOpen(false)}
				title="Form Example"
				modalContent={
					<div style={{ padding: '20px' }}>
						<form onSubmit={handleSubmit}>
							<div style={{ marginBottom: '15px' }}>
								<label style={{ display: 'block', marginBottom: '5px' }}>Name</label>
								<input
									type="text"
									name="name"
									value={formData.name}
									onChange={handleChange}
									style={{
										width: '100%',
										padding: '8px',
										backgroundColor: '#2d2d2d',
										border: '1px solid #444',
										borderRadius: '4px',
										color: 'white',
									}}
									required
								/>
							</div>
							<div style={{ marginBottom: '15px' }}>
								<label style={{ display: 'block', marginBottom: '5px' }}>Email</label>
								<input
									type="email"
									name="email"
									value={formData.email}
									onChange={handleChange}
									style={{
										width: '100%',
										padding: '8px',
										backgroundColor: '#2d2d2d',
										border: '1px solid #444',
										borderRadius: '4px',
										color: 'white',
									}}
									required
								/>
							</div>
							<div
								style={{
									display: 'flex',
									justifyContent: 'flex-end',
									gap: '10px',
									marginTop: '20px',
								}}
							>
								<Button type="button" onClick={() => setIsOpen(false)}>
									Cancel
								</Button>
								<Button type="submit">Submit</Button>
							</div>
						</form>
					</div>
				}
			/>
		</div>
	);
};
