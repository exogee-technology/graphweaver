# Graphweaver Xero example

An example of using Graphweaver with Xero

## Get Started

You'll need the following:

- Xero Developer App credentials: A Xero Client ID, Secret and OAuth Redirect URIs

```shell
# Install NPM dependencies
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

Once started, `http://localhost:9000` will redirect you to Xero to login via the `XeroAuthApolloPlugin`. Xero will then redirect you to your `XERO_CLIENT_REDIRECT_URIS` with credentials in the url.

The `XeroAuthCodeReceiver` handles setting your auth in local storage.
