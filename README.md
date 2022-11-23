# GraphWeaver

## Getting Started with GraphWeaver

You can create a new project with the __GraphWeaver CLI__, by running `npm init @exogee/graphweaver`.

The prompts will ask you which backends to install, and create a scaffold project with schema folders ready to create a schema.

```
❯ npm init @exogee/graphweaver
GraphWeaver

? What would your like to call your new project? 
test-project

? Which GraphWeaver backends will you need? 
MikroORM - PostgreSQL Backend
REST Backend

? OK, we're ready- I'm going to create a new app in /Users/helloworld/project- is that OK? 
Yes

All Done!

Make sure you npm install / yarn install / pnpm install, then run the start script to get started
❯ 
```

## Examples

### examples/example-basic - `@exogee/graphweaver-example-basic`
Stripped down example of using GraphWeaver with the MikroORM adapter.

```
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

```
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

```typescript
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
