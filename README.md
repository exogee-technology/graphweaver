# GraphWeaver

## Examples

### examples/example-basic - `@exogee/graphweaver-example-basic`
Stripped down example of using GraphWeaver with the MikroORM adapter.

```shell
pnpm install
cd src/apps/graphweaver && pnpm build
cd src/examples/example-basic && pnpm start
```

### examples/example-complex - `@exogee/graphweaver-example-complex`
A more complex example of using GraphWeaver with multiple adapters and relationships.

```shell
pnpm install
cd src/apps/example-complex && pnpm build && pnpm start
```


## Packages

### packages/core - `@exogee/graphweaver`
GraphWeaver core package, includes `createBaseResolver` method that creates a resolver in combination with one of the backend packages:

```ts
@Resolver(() => UserGQLEntity)
export class UserGQLResolver extends createBaseResolver(
	UserGQLEntity,
	new MikroBackendProvider(User)
) {}
```

## packages/apollo - `@exogee/graphweaver-apollo`
Apollo support for graphweaver, includes various plugins.

## packages/mikroorm - `@exogee/graphweaver-mikroorm`
MikroORM backend support for graphweaver

## packages/rest - `@exogee/graphweaver-rest`
RESTful backend support for graphweaver

## packages/rls - `@exogee/graphweaver-rls`
Row-level security support for graphweaver
