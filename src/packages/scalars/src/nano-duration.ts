import { GraphQLScalarType } from 'graphql';
import { GraphQLBigInt } from 'graphql-scalars';

// The underlying type is BigInt, but we're using a custom name and description for display purposes
const GraphQLNanoDurationConfig = {
	...GraphQLBigInt,
	name: 'NanoDuration',
	description: 'A duration in nanoseconds',
};

export const GraphQLNanoDuration = new GraphQLScalarType(GraphQLNanoDurationConfig);
