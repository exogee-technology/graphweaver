import { DirectiveLocation } from 'graphql';

import { graphweaverMetadata } from '..';
import { LinkPurpose } from './enums';
import { LinkImportGraphQLType } from './scalars';

const addLinkDirectives = () => {
	graphweaverMetadata.collectDirectiveTypeInformation({
		name: 'link',
		target: {}, // Do we need to pass the target here?
		args: {
			url: {
				type: () => String,
				nullable: false,
			},
			as: {
				type: () => String,
				nullable: true,
			},
			for: {
				type: () => LinkPurpose,
				nullable: true,
			},
			import: {
				type: () => [LinkImportGraphQLType],
				nullable: true,
			},
		},
		locations: [DirectiveLocation.SCHEMA],
		isRepeatable: true,
	});
};

export const addDirectives = () => {
	addLinkDirectives();
};
