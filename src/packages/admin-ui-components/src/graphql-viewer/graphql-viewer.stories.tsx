import React from 'react';
import { Meta, StoryObj } from '@storybook/react';
import { GraphQlViewer } from './component';

const meta = {
	title: 'Display/GraphQlViewer',
	component: GraphQlViewer,
	parameters: {
		docs: {
			description: {
				component: 'A syntax-highlighted viewer for GraphQL queries and operations.',
			},
		},
	},
	argTypes: {
		graphql: {
			control: 'text',
			description: 'The GraphQL query string to display',
		},
	},
} as Meta<typeof GraphQlViewer>;

export default meta;
type Story = StoryObj<typeof meta>;

// Simple query example
export const SimpleQuery: Story = {
	args: {
		graphql: `query GetUser {
  user(id: "123") {
    id
    name
    email
  }
}`,
	},
};

// Query with variables
export const QueryWithVariables: Story = {
	args: {
		graphql: `query GetUser($id: ID!, $includeOrders: Boolean!) {
  user(id: $id) {
    id
    name
    email
    orders @include(if: $includeOrders) {
      id
      orderDate
      total
    }
  }
}

# Variables:
# {
#   "id": "123",
#   "includeOrders": true
# }`,
	},
};

// Complex query with fragments
export const ComplexQuery: Story = {
	args: {
		graphql: `# Query with fragments and nested data
query GetUserWithOrders($id: ID!) {
  user(id: $id) {
    ...UserDetails
    orders {
      ...OrderDetails
      items {
        ...OrderItemDetails
      }
    }
  }
}

fragment UserDetails on User {
  id
  name
  email
  avatarUrl
  role
  createdAt
}

fragment OrderDetails on Order {
  id
  orderNumber
  orderDate
  status
  total
  shippingAddress {
    street
    city
    state
    zipCode
    country
  }
}

fragment OrderItemDetails on OrderItem {
  id
  productName
  quantity
  unitPrice
  totalPrice
}`,
	},
};

// Mutation example
export const Mutation: Story = {
	args: {
		graphql: `mutation CreateUser($input: CreateUserInput!) {
  createUser(input: $input) {
    id
    name
    email
    createdAt
  }
}

# Variables:
# {
#   "input": {
#     "name": "John Doe",
#     "email": "john.doe@example.com",
#     "password": "securePassword123"
#   }
# }`,
	},
};

// Example with errors
export const WithErrors: Story = {
	args: {
		graphql: `query GetUser {
  user(id: "123") {
    id
    name
    # This field doesn't exist
    nonExistentField
    email
  }
}

# Error: Cannot query field "nonExistentField" on type "User".`,
	},
};
