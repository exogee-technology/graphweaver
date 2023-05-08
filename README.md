# GraphWeaver

## Getting Started with GraphWeaver

You can create a new project with the **GraphWeaver CLI**, by running `npx @exogee/graphweaver-cli create`.

The prompts will ask you which backends to install, and create a scaffold project with schema folders ready to create a schema.

```
❯ npm init @exogee/graphweaver
GraphWeaver

? What would your like to call your new project?
test-project

? Which GraphWeaver backends will you need?
 ◯ MikroORM - PostgreSQL Backend
 ◯ MikroORM - MySQL Backend
 ◯ REST Backend

? OK, we're ready- I'm going to create a new app in "/Users/test-project" - is that OK?
Yes

All Done!

Make sure you npm install / yarn install / pnpm install, then run the start script to get started
❯
```

## Examples

### examples/databases - `@exogee/graphweaver-example-databases`

An example of using GraphWeaver with two connected databases (MySQL, PostgreSQL) and the MikroORM adapter.

Follow the instructions in the `./src/examples/databases/README.md` to get started.

### examples/rest - `@exogee/graphweaver-example-rest`

It is possible to connect a database and an external REST API to GraphWeaver and expose the data via the GraphQL API.

This example demonstrates how to do that with MySQL and the Star Wars API.

Follow the instructions in the `./src/examples/rest/README.md` to get started.

### examples/xero - `@exogee/graphweaver-example-xero`

An example of using GraphWeaver with Xero

Follow the instructions in the `./src/examples/xero/README.md` to get started.

## Packages

### packages/core - `@exogee/graphweaver`

GraphWeaver core package includes `createBaseResolver` method that creates a resolver in combination with one of the backend packages:

```typescript
@Resolver(() => UserGQLEntity)
export class UserGQLResolver extends createBaseResolver(
  UserGQLEntity,
  new MikroBackendProvider(User)
) {}
```

### packages/apollo - `@exogee/graphweaver-apollo`

Apollo support for graphweaver includes various plugins.

### packages/mikroorm - `@exogee/graphweaver-mikroorm`

MikroORM backend support for graphweaver

### packages/rest - `@exogee/graphweaver-rest`

RESTful backend support for graphweaver

### packages/auth - `@exogee/graphweaver-auth`

Row-level security support for graphweaver

## Contributing

### Publishing

To publish the packages in the monorepo first you need to assess the types of changes that occurred. Follow semver and run
the appropriate command for `major`, `minor` or `patch` changes.

```console
$ pnpm version:bump patch
```

Now the versions are bumped, but packages that depend on each other are still referencing the old version. Run this command
to update all the references across the monorepo.

```console
$ pnpm relink:deps
```

Now we're ready to publish. Run:

```console
$ pnpm publish:dry
```

This will show you what would be published if you went ahead and did one.

If you're happy with these and want to publish these changes, run

```console
$ pnpm publish:packages --otp [code from 2FA device]
```

You're done!
