# Graphweaver Mailchimp example

An example of using Graphweaver that integrates with mailchimp.

```shell
# Install NPM dependencies
pnpm i

# If running from monorepo, make sure the monorepo is built
cd .. && pnpm build

# Set up .env
MAILCHIMP_API_KEY= # To generate an API key, navigate to the API Keys section of the mailchimp account and click Create New Key. Click Generate Key and Copy Key to Clipboard.
MAILCHIMP_SERVER_PREFIX=us16 # The root url for the API is API is https://<dc>.api.mailchimp.com/3.0/. The <dc> part of the URL is the prefix here.
MAILCHIMP_LIST_ID= # The unique id for the list object in Mailchimp
MAILCHIMP_PROJECTS_CATEGORY_ID= # The unique id for the category object in Mailchimp

# Run Graphweaver CLI
pnpm graphweaver start

```

Once started, connect to `http://localhost:9000/` to access the Graphweaver dashboard.
