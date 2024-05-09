import Graphweaver from '@exogee/graphweaver-server';

import './schema';
import { SchemaBuilder, graphweaverMetadata } from '@exogee/graphweaver';

export const graphweaver = new Graphweaver();

export const handler = graphweaver.handler();

console.log('Schema:');
console.log(SchemaBuilder.print());
