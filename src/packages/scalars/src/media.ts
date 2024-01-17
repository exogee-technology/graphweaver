import { GraphQLScalarType } from 'graphql';

export const MediaScalar = new GraphQLScalarType({
	name: 'Media',
	description: 'Media type scalar',
	serialize(value: unknown): string {
		// check the type of received value
		if (typeof value !== 'string') {
			throw new Error('Media Scalar can only serialize Media values');
		}
		return value.toString();
	},
});
