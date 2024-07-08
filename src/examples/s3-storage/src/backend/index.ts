import Graphweaver from '@exogee/graphweaver-server';

import './schema';

export const graphweaver = new Graphweaver({
	federationSubgraphName: 'storage',
});
export const handler = graphweaver.handler();
