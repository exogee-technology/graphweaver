# GraphWeaver

## Examples

### examples/example-basic - `@exogee/graphweaver-example-basic`
Stripped down example of using GraphWeaver with the MikroORM adapter.

```shell
# Install dependencies
pnpm install

# Set up .env in apps/example-basic
DATABASE_HOST=
DATABASE_USERNAME=
DATABASE_PASSWORD=
DATABASE_NAME=

# Run migration, build graphweaver packages, and run example app
cd src/apps/example-basic && pnpm start
```

### examples/example-complex - `@exogee/graphweaver-example-complex`
A more complex example of using GraphWeaver with multiple adapters and relationships in serverless.

```shell
# Install dependencies
pnpm install

# Set up .env in apps/example-complex
DATABASE_HOST=
DATABASE_USERNAME=
DATABASE_PASSWORD=
DATABASE_NAME=

# Run migration, build and run example app
cd src/apps/example-complex && pnpm migrate && pnpm build && pnpm start
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

### packages/apollo - `@exogee/graphweaver-apollo`
Apollo support for graphweaver, includes various plugins.

### packages/mikroorm - `@exogee/graphweaver-mikroorm`
MikroORM backend support for graphweaver

### packages/rest - `@exogee/graphweaver-rest`
RESTful backend support for graphweaver

### packages/rls - `@exogee/graphweaver-rls`
Row-level security support for graphweaver
