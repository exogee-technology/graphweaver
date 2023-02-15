# examples/example-xero - `@exogee/graphweaver-example-xero`
An example of using GraphWeaver with Xero

```shell
# Install dependencies
pnpm i

# If running from monorepo, make sure the monorepo is built
cd .. && pnpm build

# Set up .env 
XERO_CLIENT_ID=
XERO_CLIENT_SECRET=
XERO_CLIENT_REDIRECT_URIS=

# Run Graphweaver CLI
pnpm graphweaver start

# OR if in a container, run listening to all interfaces (or a specific interface):
pnpm graphweaver start --host 0.0.0.0
```
