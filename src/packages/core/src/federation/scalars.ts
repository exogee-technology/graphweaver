import { GraphQLScalarType } from 'graphql';

export const AnyGraphQLType = new GraphQLScalarType({
	name: '_Any',
	serialize(value) {
		return value;
	},
});

export const LinkImportGraphQLType = new GraphQLScalarType({
	name: 'link__Import',
	specifiedByURL: null,
});

export const FieldSetGraphQLType = new GraphQLScalarType({
	name: 'FieldSet',
});
