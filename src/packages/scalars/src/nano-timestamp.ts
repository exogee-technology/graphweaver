import { GraphQLScalarType } from 'graphql';
import { GraphQLBigInt } from 'graphql-scalars';

// The underlying type is BigInt, but we're using a custom name and description for display purposes
const GraphQLNanoTimestampConfig = {
	...GraphQLBigInt,
	name: 'NanoTimestamp',
	description: 'A timestamp in nanoseconds',
	extensions: {
		type: 'integer',
	},
};

export const GraphQLNanoTimestamp = new GraphQLScalarType(GraphQLNanoTimestampConfig);
