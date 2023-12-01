# Graphweaver Mailchimp example

An example of using Graphweaver that integrates with mailchimp.

```shell
# Install NPM dependencies
pnpm i

# If running from monorepo, make sure the monorepo is built
cd .. && pnpm build

# Set up .env
MAILCHIMP_API_KEY=
MAILCHIMP_SERVER_PREFIX=
MAILCHIMP_LIST_ID=
MAILCHIMP_PROJECTS_CATEGORY_ID=

# Run Graphweaver CLI
pnpm graphweaver start

```
Once started, connect to `http://localhost:9000/` to access the Graphweaver dashboard.
