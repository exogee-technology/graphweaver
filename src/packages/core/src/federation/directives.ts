import { DirectiveLocation } from 'graphql';

import { graphweaverMetadata } from '..';
import { LinkPurpose } from './enums';
import { LinkImportType } from './scalars';

const addLinkDirectives = () => {
	graphweaverMetadata.collectDirectiveTypeInformation({
		name: 'link',
		target: {},
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
				type: () => [LinkImportType],
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
