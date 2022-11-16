# examples/example-complex - `@exogee/graphweaver-example-complex`
A more complex example of using GraphWeaver with multiple adapters and relationships.

```shell
# Install dependencies
pnpm install

# Set up .env in apps/example-complex
```dotenv
DATABASE_HOST=
DATABASE_USERNAME=
DATABASE_PASSWORD=
DATABASE_NAME=
```

# Run migration, build and run example app
cd src/apps/example-complex && pnpm migrate && pnpm build && pnpm start
```
