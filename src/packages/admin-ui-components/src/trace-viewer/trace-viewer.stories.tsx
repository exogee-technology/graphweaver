import type { Meta, StoryObj } from '@storybook/react';
import { TraceViewer } from './component';
import { Span } from '../utils';

// Mock trace data
const createMockTraces = (): Span[] => {
	const baseTime = BigInt('1686743558000000000'); // June 14, 2023 in nanoseconds

	// GraphQL query used in the trace
	const graphqlQuery = `
    query GetUsers($limit: Int, $filter: UserFilter) {
      User(limit: $limit, filter: $filter) {
        id
        name
        email
        roles
        createdAt
      }
    }
  `;

	// GraphQL variables
	const variables = JSON.stringify(
		{
			limit: 10,
			filter: {
				roles: ['ADMIN'],
			},
		},
		null,
		2
	);

	// Root span (the GraphQL query)
	const rootSpan: Span = {
		id: '1',
		spanId: 'span-1',
		parentId: null,
		traceId: 'trace-1',
		name: 'GraphQL Query: GetUsers',
		duration: '120000000', // 120ms in nanoseconds
		timestamp: baseTime.toString(),
		attributes: {
			body: JSON.stringify({
				query: graphqlQuery,
				variables: variables,
			}),
		},
	};

	// Database query span
	const dbQuerySpan: Span = {
		id: '2',
		spanId: 'span-2',
		parentId: 'span-1',
		traceId: 'trace-1',
		name: 'Database Query',
		duration: '80000000', // 80ms in nanoseconds
		timestamp: (baseTime + BigInt(15000000)).toString(), // 15ms after the root span
		attributes: {
			database: 'postgres',
			query: 'SELECT * FROM users WHERE role = $1 LIMIT $2',
		},
	};

	// Fetch user roles span
	const fetchRolesSpan: Span = {
		id: '3',
		spanId: 'span-3',
		parentId: 'span-2',
		traceId: 'trace-1',
		name: 'Fetch User Roles',
		duration: '30000000', // 30ms in nanoseconds
		timestamp: (baseTime + BigInt(40000000)).toString(), // 40ms after the root span
		attributes: {
			table: 'user_roles',
			method: 'JOIN',
		},
	};

	// Authorization check span
	const authCheckSpan: Span = {
		id: '4',
		spanId: 'span-4',
		parentId: 'span-1',
		traceId: 'trace-1',
		name: 'Authorization Check',
		duration: '10000000', // 10ms in nanoseconds
		timestamp: (baseTime + BigInt(5000000)).toString(), // 5ms after the root span
		attributes: {
			user: 'admin',
			authorized: true,
		},
	};

	// Format results span
	const formatResultsSpan: Span = {
		id: '5',
		spanId: 'span-5',
		parentId: 'span-1',
		traceId: 'trace-1',
		name: 'Format Results',
		duration: '15000000', // 15ms in nanoseconds
		timestamp: (baseTime + BigInt(100000000)).toString(), // 100ms after the root span
		attributes: {
			resultCount: 5,
			format: 'JSON',
		},
	};

	return [rootSpan, authCheckSpan, dbQuerySpan, fetchRolesSpan, formatResultsSpan];
};

const simpleMockTraces = (): Span[] => {
	const baseTime = BigInt('1686743558000000000'); // June 14, 2023 in nanoseconds

	// GraphQL query for the simplified example
	const graphqlQuery = `
    query GetUser($id: ID!) {
      User(id: $id) {
        id
        name
      }
    }
  `;

	// GraphQL variables
	const variables = JSON.stringify(
		{
			id: 'user-123',
		},
		null,
		2
	);

	// Root span (the GraphQL query)
	const rootSpan: Span = {
		id: '1',
		spanId: 'span-1',
		parentId: null,
		traceId: 'trace-1',
		name: 'GraphQL Query: GetUser',
		duration: '50000000', // 50ms in nanoseconds
		timestamp: baseTime.toString(),
		attributes: {
			body: JSON.stringify({
				query: graphqlQuery,
				variables: variables,
			}),
		},
	};

	// Database query span
	const dbQuerySpan: Span = {
		id: '2',
		spanId: 'span-2',
		parentId: 'span-1',
		traceId: 'trace-1',
		name: 'Database Query',
		duration: '30000000', // 30ms in nanoseconds
		timestamp: (baseTime + BigInt(10000000)).toString(), // 10ms after the root span
		attributes: {
			database: 'postgres',
			query: 'SELECT * FROM users WHERE id = $1',
		},
	};

	return [rootSpan, dbQuerySpan];
};

const complexMockTraces = (): Span[] => {
	const baseTime = BigInt('1686743558000000000');
	const baseTraces = createMockTraces();

	// Add some more complex nested spans
	const cacheLookupSpan: Span = {
		id: '6',
		spanId: 'span-6',
		parentId: 'span-1',
		traceId: 'trace-1',
		name: 'Cache Lookup',
		duration: '5000000', // 5ms in nanoseconds
		timestamp: (baseTime + BigInt(2000000)).toString(), // 2ms after the root span
		attributes: {
			cacheHit: false,
			cacheType: 'redis',
		},
	};

	const dataTransformSpan: Span = {
		id: '7',
		spanId: 'span-7',
		parentId: 'span-5',
		traceId: 'trace-1',
		name: 'Data Transform',
		duration: '8000000', // 8ms in nanoseconds
		timestamp: (baseTime + BigInt(102000000)).toString(), // 102ms after the root span
		attributes: {
			transformType: 'camelCase',
			fields: ['name', 'email'],
		},
	};

	const loggingSpan: Span = {
		id: '8',
		spanId: 'span-8',
		parentId: 'span-1',
		traceId: 'trace-1',
		name: 'Log Request',
		duration: '3000000', // 3ms in nanoseconds
		timestamp: (baseTime + BigInt(115000000)).toString(), // 115ms after the root span
		attributes: {
			logLevel: 'info',
			message: 'Request completed successfully',
		},
	};

	return [...baseTraces, cacheLookupSpan, dataTransformSpan, loggingSpan];
};

// Create empty traces for the loading or empty state
const emptyTraces = (): Span[] => {
	const baseTime = BigInt('1686743558000000000');

	// Just a root span with minimal info
	const rootSpan: Span = {
		id: '1',
		spanId: 'span-1',
		parentId: null,
		traceId: 'trace-1',
		name: 'Empty Trace',
		duration: '0', // 0ms
		timestamp: baseTime.toString(),
		attributes: {
			body: JSON.stringify({
				query: '',
				variables: '{}',
			}),
		},
	};

	return [rootSpan];
};

const meta = {
	title: 'Components/TraceViewer',
	component: TraceViewer,
	parameters: {
		layout: 'padded',
	},
} as Meta<typeof TraceViewer>;

export default meta;
type Story = StoryObj<typeof meta>;

// Default trace viewer with sample trace
export const Default: Story = {
	args: {
		traces: createMockTraces(),
	},
};

// Simplified trace for a basic example
export const SimpleTrace: Story = {
	args: {
		traces: simpleMockTraces(),
	},
};

// Complex trace with multiple nested spans
export const ComplexTrace: Story = {
	args: {
		traces: complexMockTraces(),
	},
};

// Empty state
export const EmptyTrace: Story = {
	args: {
		traces: emptyTraces(),
	},
};
