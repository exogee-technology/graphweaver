# Graphweaver EventBrite example

An example of using Graphweaver that integrates with EventBrite.

```shell
# Install NPM dependencies
pnpm i

# If running from monorepo, make sure the monorepo is built
cd .. && pnpm build

# Set up .env
EVENTBRITE_ACCESS_TOKEN=
EVENTBRITE_ORG_ID=

# Run Graphweaver CLI
pnpm graphweaver start

```

Once started, connect to `http://localhost:9000/` to access the Graphweaver dashboard.
