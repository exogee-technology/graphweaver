# Graphweaver Xero example

An example of using GraphWeaver with Xero

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

Once started, connect to `http://localhost:3000/connect` to authorize your Xero account-
you'll receive a message telling you that the `token.json` has been stored.

Once the token is stored, connect to `http://localhost:8000/` to access the Graphweaver dashboard.
