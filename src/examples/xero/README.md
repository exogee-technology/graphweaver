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

## How to Start a Free Trial of Xero

1. Navigate to https://www.xero.com/au/
2. Click "Try Xero for free"
3. Fill out the form and verify your email
4. Create a password
5. You will be asked to create a new org "Add your business"
6. Give your business a name "Test Company"
7. Choose any industry
8. Do you have employees? (no its just me)
9. Click "Start trial"
10. Next visit the xero developers page https://developer.xero.com/
11. Click the "new app" button
12. Give the app a name
13. Choose "Web app"
14. Company or application URL: (https://localhost:9000)
15. Redirect URL: (http://localhost:9000/xero-auth-code)

Finally, copy your XERO_CLIENT_ID and XERO_CLIENT_SECRET from the Configuration page.
