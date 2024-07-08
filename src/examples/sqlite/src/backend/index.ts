import Graphweaver from '@exogee/graphweaver-server';
import { MikroBackendProvider } from '@exogee/graphweaver-mikroorm';

import './schema';

import { traceConnection } from './database';
import { Trace } from './entities';

export const traceProvider = new MikroBackendProvider(Trace, traceConnection);

export const graphweaver = new Graphweaver({
	openTelemetry: {
		traceProvider,
	},
});
export const handler = graphweaver.handler();
