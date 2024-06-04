import Graphweaver from '@exogee/graphweaver-server';

import './schema';

// extend type Query {
//   product(id: ID!): Product
//   deprecatedProduct(sku: String!, package: String!): DeprecatedProduct @deprecated(reason: "Use product query instead")
// }

export const graphweaver = new Graphweaver({
	enableFederation: true,
});

export const handler = graphweaver.handler();
