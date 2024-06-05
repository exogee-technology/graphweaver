import { GraphQLScalarType } from 'graphql';

export const AnyType = new GraphQLScalarType({
	name: '_Any',
	serialize(value) {
		return value;
	},
});

export const LinkImportType = new GraphQLScalarType({
	name: 'link__Import',
	specifiedByURL: null,
});
