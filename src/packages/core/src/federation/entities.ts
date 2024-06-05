import { graphweaverMetadata } from '..';

export const addEntitiesQuery = () => {
	graphweaverMetadata.addQuery({
		name: '_entities',
		description:
			'Union of all types in this subgraph. This information is needed by the Apollo federation gateway.',
		getType: () => String,
		resolver: () => {},
	});
};
