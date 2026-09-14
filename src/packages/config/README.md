# Graphweaver Config `@exogee/graphweaver-config`

Retrieve and parse Graphweaver configuration.

## Configuration file

Graphweaver reads `graphweaver-config.js` or `graphweaver-config.ts` from the root of your
project. TypeScript is preferred when both are present.

A TypeScript config is transpiled and bundled with esbuild before it's evaluated, so it can import
helpers from elsewhere in your project and use any TypeScript syntax, not just the parts that
survive type stripping. Imports from `node_modules` are left alone and resolved against your own
install at run time.

Wrap the config in `defineConfig` for type checking and autocomplete:

```ts
// graphweaver-config.ts
import { defineConfig } from '@exogee/graphweaver-config';

export default defineConfig({
	trustedDocuments: {
		allowLists: {
			web: ['src/frontend/web/**/*.graphql'],
		},
	},
});
```

`defineConfig` is only there for the types, so a plain `export default { ... }` works too, as does
`module.exports = { ... }` in a JavaScript config.

## Documentation

Comprehensive documentation and usage examples can be found on our [Docs Site](https://graphweaver.com/docs). It covers installation instructions, detailed API documentation, and guides to help you get started with Graphweaver.

## Graphweaver CLI `graphweaver`

The Graphweaver Command Line Interface (CLI) tool enables you to set up and manage Graphweaver using commands in your command-line shell. Check the `graphweaver` npm package [here.](https://www.npmjs.com/package/graphweaver)
