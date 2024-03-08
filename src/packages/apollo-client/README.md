# `@exogee/graphweaver-apollo-client`

Useful helpers for working with Apollo Client and Graphweaver.

The package currently only exposes a single function (`addTypePolicies`) that will generate a working Apollo Client Type Policy for the Graphweaver entities.

To use it:

```
import { generateTypePolicies } from '@exogee/graphweaver-apollo-client';
import { InMemoryCache } from '@apollo/client';

const cache = new InMemoryCache();

const entityNames = ['Users', 'Tasks'];
const typePolicies = generateTypePolicies(entityNames);
cache.policies.addTypePolicies(typePolicies);

```

This policy does two things when looping through all the entities in the schema it:

1. Creates a KeyArgs Function that will cache the entities based on the filter and pagination arguments.
2. It creates a merge function for collections so that paginated results are returned into the same array when paginating.

## Documentation

Comprehensive documentation and usage examples can be found on our [Docs Site](https://graphweaver.com/docs). It covers installation instructions, detailed API documentation, and guides to help you get started with Graphweaver.

## Graphweaver CLI `graphweaver`

The Graphweaver Command Line Interface (CLI) tool enables you to set up and manage Graphweaver using commands in your command-line shell. Check the `graphweaver` npm package [here.](https://www.npmjs.com/package/graphweaver)
