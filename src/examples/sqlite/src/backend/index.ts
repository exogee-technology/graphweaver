import Graphweaver from '@exogee/graphweaver-server';
import { MikroBackendProvider } from '@exogee/graphweaver-mikroorm';

import './schema';

import { connection } from './database';
import { Trace } from './entities';

export const traceProvider = new MikroBackendProvider(Trace, connection);

export const graphweaver = new Graphweaver({});
export const handler = graphweaver.handler();
