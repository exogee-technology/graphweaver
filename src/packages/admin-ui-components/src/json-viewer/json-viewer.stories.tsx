import React from 'react';
import { Meta, StoryObj } from '@storybook/react';
import { JsonViewer } from './component';

const meta = {
	title: 'Components/JsonViewer',
	component: JsonViewer,
	parameters: {
		docs: {
			description: {
				component: 'A syntax-highlighted viewer for JSON data with configurable display options.',
			},
		},
	},
	argTypes: {
		text: {
			control: 'object',
			description: 'The JSON data to display, either as a string or an object',
		},
	},
} as Meta<typeof JsonViewer>;

export default meta;
type Story = StoryObj<typeof meta>;

// Simple JSON object
export const SimpleObject: Story = {
	args: {
		text: {
			name: 'John Doe',
			age: 30,
			email: 'john.doe@example.com',
			isActive: true,
		},
	},
};

// JSON with nested objects
export const NestedObjects: Story = {
	args: {
		text: {
			id: 'user-123',
			profile: {
				firstName: 'John',
				lastName: 'Doe',
				avatar: 'https://example.com/avatar.jpg',
			},
			contact: {
				email: 'john.doe@example.com',
				phone: '+1-234-567-8901',
				address: {
					street: '123 Main St',
					city: 'Anytown',
					state: 'CA',
					zipCode: '12345',
					country: 'USA',
				},
			},
			preferences: {
				theme: 'dark',
				notifications: true,
				newsletter: false,
			},
		},
	},
};

// JSON with arrays
export const WithArrays: Story = {
	args: {
		text: {
			users: [
				{
					id: 1,
					name: 'John Doe',
					roles: ['admin', 'editor'],
				},
				{
					id: 2,
					name: 'Jane Smith',
					roles: ['user'],
				},
				{
					id: 3,
					name: 'Bob Johnson',
					roles: ['editor', 'reviewer'],
				},
			],
			totalUsers: 3,
			activePage: 1,
		},
	},
};

// JSON with null values
export const WithNullValues: Story = {
	args: {
		text: {
			id: 42,
			name: 'Product',
			description: null,
			price: 29.99,
			inStock: true,
			category: 'Electronics',
			tags: ['gadget', 'new'],
			dimensions: {
				width: 10.5,
				height: 15.2,
				depth: null,
			},
			relatedItems: null,
		},
	},
};

// Large complex JSON
export const ComplexJSON: Story = {
	args: {
		text: {
			apiVersion: 'v1',
			data: {
				products: [
					{
						id: 'prod-1',
						name: 'Smartphone',
						category: 'Electronics',
						price: 699.99,
						specifications: {
							dimensions: '5.8 x 2.8 x 0.3 inches',
							weight: '6.1 ounces',
							display: '6.1-inch OLED',
							camera: '12MP dual lens',
							battery: '3000mAh',
							storage: ['64GB', '128GB', '256GB'],
						},
						variants: [
							{ color: 'Black', sku: 'SM-BLK-64', inStock: true, storage: '64GB' },
							{ color: 'Black', sku: 'SM-BLK-128', inStock: true, storage: '128GB' },
							{ color: 'Silver', sku: 'SM-SLV-64', inStock: false, storage: '64GB' },
							{ color: 'Gold', sku: 'SM-GLD-256', inStock: true, storage: '256GB' },
						],
						reviews: [
							{ user: 'user123', rating: 4.5, comment: 'Great phone, amazing camera!' },
							{ user: 'techguru', rating: 5, comment: 'Best smartphone in this price range.' },
						],
					},
					{
						id: 'prod-2',
						name: 'Laptop',
						category: 'Computers',
						price: 1299.99,
						specifications: {
							dimensions: '12.8 x 8.9 x 0.6 inches',
							weight: '3.1 pounds',
							display: '13.3-inch Retina',
							processor: 'Quad-core i7',
							ram: ['8GB', '16GB', '32GB'],
							storage: ['256GB SSD', '512GB SSD', '1TB SSD'],
						},
						variants: [
							{ ram: '8GB', storage: '256GB SSD', sku: 'LP-8-256', inStock: true },
							{ ram: '16GB', storage: '512GB SSD', sku: 'LP-16-512', inStock: true },
							{ ram: '32GB', storage: '1TB SSD', sku: 'LP-32-1TB', inStock: false },
						],
					},
				],
				metadata: {
					totalProducts: 2,
					lastUpdated: '2023-08-05T14:30:00Z',
					currency: 'USD',
					pagination: {
						currentPage: 1,
						totalPages: 5,
						itemsPerPage: 10,
						totalItems: 42,
					},
				},
			},
			status: 'success',
			responseTime: '120ms',
		},
	},
};

// JSON as a string
export const StringJSON: Story = {
	args: {
		text: `{
  "name": "John Doe",
  "age": 30,
  "email": "john.doe@example.com",
  "isActive": true,
  "address": {
    "street": "123 Main St",
    "city": "Anytown",
    "zipCode": "12345"
  },
  "phoneNumbers": [
    {
      "type": "home",
      "number": "555-1234"
    },
    {
      "type": "work",
      "number": "555-5678"
    }
  ]
}`,
	},
};
