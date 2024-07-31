import Graphweaver from '@exogee/graphweaver-server';
import { DirectiveLocation, graphweaverMetadata } from '@exogee/graphweaver';

import './schema';

// Register Custom Directive
graphweaverMetadata.collectDirectiveTypeInformation({
	name: 'custom',
	locations: [DirectiveLocation.OBJECT],
});

export const graphweaver = new Graphweaver({
	federationSubgraphName: 'example',
	enableFederationTracing: true,
	schemaDirectives: {
		composeDirective: {
			name: '@custom',
		},
		link: {
			url: 'https://myspecs.dev/myCustomDirective/v1.0',
			import: ['@custom'],
		},
	},
});
