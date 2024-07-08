import Graphweaver from '@exogee/graphweaver-server';

import './schema';

export const graphweaver = new Graphweaver({ federationSubgraphName: 'test' });
export const handler = graphweaver.handler();
