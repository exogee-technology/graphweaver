import React, { useState } from 'react';
import { Meta, StoryObj } from '@storybook/react';
import { Popover, PopoverItem } from './component';
import { Button } from '../button';

const meta = {
	title: 'Display/Popover',
	component: Popover,
	parameters: {
		docs: {
			description: {
				component: 'A dropdown menu component that displays a list of items when clicked.',
			},
		},
	},
	argTypes: {
		items: {
			description: 'Array of items to display in the popover menu',
		},
		children: {
			description: 'Content for the trigger button',
		},
		defaultValue: {
			description: 'Default selected value to display in the button',
		},
		position: {
			control: 'radio',
			options: ['top', 'bottom'],
			description: 'Position of the popover relative to the trigger',
		},
	},
	decorators: [
		(Story) => (
			<div style={{ padding: '40px', height: '300px', display: 'flex', justifyContent: 'center' }}>
				<Story />
			</div>
		),
	],
} as Meta<typeof Popover>;

export default meta;
type Story = StoryObj<typeof meta>;

// Sample items for the popover
const sampleItems: PopoverItem[] = [
	{
		id: 'item-1',
		name: 'Edit',
		onClick: () => console.log('Edit clicked'),
	},
	{
		id: 'item-2',
		name: 'Delete',
		onClick: () => console.log('Delete clicked'),
	},
	{
		id: 'item-3',
		name: 'Duplicate',
		onClick: () => console.log('Duplicate clicked'),
	},
];

// Basic example with items
export const Default: Story = {
	args: {
		items: sampleItems,
		children: 'Actions',
	},
};

// Popover with a default selected value
export const WithDefaultValue: Story = {
	args: {
		items: sampleItems,
		defaultValue: sampleItems[0],
	},
};

// Popover positioned above the button
export const PositionedTop: Story = {
	args: {
		items: sampleItems,
		children: 'Show Above',
		position: 'top',
	},
};

// Popover with items that have links
export const WithLinks: Story = {
	args: {
		items: [
			{
				id: 'home',
				name: 'Home',
				href: '#home',
			},
			{
				id: 'about',
				name: 'About',
				href: '#about',
			},
			{
				id: 'contact',
				name: 'Contact',
				href: '#contact',
			},
		],
		children: 'Navigation',
	},
};

// Interactive popover with state
export const Interactive = () => {
	const [selectedOption, setSelectedOption] = useState('Select an option');

	const items: PopoverItem[] = [
		{
			id: 'option-1',
			name: 'Option 1',
			onClick: () => setSelectedOption('Option 1'),
		},
		{
			id: 'option-2',
			name: 'Option 2',
			onClick: () => setSelectedOption('Option 2'),
		},
		{
			id: 'option-3',
			name: 'Option 3',
			onClick: () => setSelectedOption('Option 3'),
		},
	];

	return (
		<div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px' }}>
			<Popover items={items}>{selectedOption}</Popover>
			<div>Selected: {selectedOption}</div>
		</div>
	);
};

// Popover with custom render function for items
export const WithCustomRendering = () => {
	const items: PopoverItem[] = [
		{
			id: 'view',
			name: 'View',
			onClick: () => console.log('View clicked'),
			renderAfter: () => (
				<span style={{ marginLeft: '5px', fontSize: '12px', opacity: 0.6 }}>👁️</span>
			),
		},
		{
			id: 'edit',
			name: 'Edit',
			onClick: () => console.log('Edit clicked'),
			renderAfter: () => (
				<span style={{ marginLeft: '5px', fontSize: '12px', opacity: 0.6 }}>✏️</span>
			),
		},
		{
			id: 'delete',
			name: 'Delete',
			onClick: () => console.log('Delete clicked'),
			renderAfter: () => (
				<span style={{ marginLeft: '5px', fontSize: '12px', opacity: 0.6 }}>🗑️</span>
			),
		},
	];

	return <Popover items={items}>Actions with Icons</Popover>;
};

// Popover with divider and sections
export const WithDividers = () => {
	const items: PopoverItem[] = [
		{
			id: 'section-1',
			name: 'File Operations',
			className: 'popoverHeader',
			onClick: () => false, // Prevent closing
		},
		{
			id: 'new',
			name: 'New',
			onClick: () => console.log('New clicked'),
		},
		{
			id: 'open',
			name: 'Open',
			onClick: () => console.log('Open clicked'),
		},
		{
			id: 'save',
			name: 'Save',
			onClick: () => console.log('Save clicked'),
		},
		{
			id: 'divider-1',
			name: '---', // Render as divider
			className: 'divider',
			onClick: () => false, // Prevent closing
		},
		{
			id: 'section-2',
			name: 'Edit Operations',
			className: 'popoverHeader',
			onClick: () => false, // Prevent closing
		},
		{
			id: 'cut',
			name: 'Cut',
			onClick: () => console.log('Cut clicked'),
		},
		{
			id: 'copy',
			name: 'Copy',
			onClick: () => console.log('Copy clicked'),
		},
		{
			id: 'paste',
			name: 'Paste',
			onClick: () => console.log('Paste clicked'),
		},
	];

	return (
		<div style={{ display: 'flex', justifyContent: 'center' }}>
			<style>
				{`
        .popoverHeader {
          font-weight: bold !important;
          color: #bcb4c9 !important;
          pointer-events: none;
          cursor: default;
        }
        .divider {
          height: 1px !important;
          padding: 0 !important;
          background-color: #3a334a !important;
          margin: 4px 0;
          pointer-events: none;
        }
        `}
			</style>
			<Popover items={items}>Menu with Sections</Popover>
		</div>
	);
};
