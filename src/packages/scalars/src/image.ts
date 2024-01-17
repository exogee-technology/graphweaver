import { GraphQLScalarType } from 'graphql';

export const ImageScalar = new GraphQLScalarType({
	name: 'Image',
	description: 'Image type scalar',
	serialize(value: unknown): string {
		// check the type of received value
		if (typeof value !== 'string') {
			throw new Error('Image Scalar can only serialize Image values');
		}
		return value.toString(); // value sent to the client
	},
});
