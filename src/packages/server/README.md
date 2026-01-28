# `@exogee/graphweaver-server`

Server support for `@exogee/graphweaver`

## Documentation

Comprehensive documentation and usage examples can be found on our [Docs Site](https://graphweaver.com/docs). It covers installation instructions, detailed API documentation, and guides to help you get started with Graphweaver.

## Graphweaver CLI `graphweaver`

The Graphweaver Command Line Interface (CLI) tool enables you to set up and manage Graphweaver using commands in your command-line shell. Check the `graphweaver` npm package [here.](https://www.npmjs.com/package/graphweaver)

## Azure Functions

To deploy Graphweaver to **Azure Cloud Functions** (Node v4), export `azureHandler` from your backend entry instead of `handler`:

```ts
// src/backend/index.ts
import Graphweaver from '@exogee/graphweaver-server';
import './schema';

export const graphweaver = new Graphweaver();
export const azureHandler = graphweaver.azureHandler();
```

Then run `graphweaver build`. The build detects `graphweaver.azureHandler()` and writes Azure output under `dist/`: `host.json` and `graphql.js` (entry that registers the handler with `@azure/functions`).

Deploy the `dist/` folder to your Azure Function App (Node 18+), with the function app's main entry set to `graphql.js` or as required by your host configuration. See [Azure Functions Node.js v4](https://learn.microsoft.com/en-us/azure/azure-functions/functions-reference-node) for deployment details.
