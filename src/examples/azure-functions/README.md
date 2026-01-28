# Azure Functions Example

This example runs Graphweaver as an Azure Function with a SQLite backend.

## Prerequisites

- Node.js 18+
- pnpm
- [Azure Functions Core Tools v4](https://learn.microsoft.com/en-us/azure/azure-functions/functions-run-local#install-the-azure-functions-core-tools)

## Setup

1. Install dependencies from the repo root:
   ```bash
   pnpm install
   ```
2. Create the SQLite database (from this directory):
   ```bash
   cat databases/database.sql | sqlite3 databases/database.sqlite
   ```

## Run locally

From this directory (or the repo root with the example cwd):

```bash
pnpm start
```

Or via the Graphweaver CLI from this directory:

```bash
graphweaver start
```

The Azure Functions runtime will start and the GraphQL endpoint will be available at:

**http://localhost:9001/** (GraphQL at root; backend uses CLI base port+1, 9001 is the default).

CORS for the admin UI (e.g. http://localhost:9000) is enabled via `local.settings.json` → `Host.CORS`. When deploying to Azure, configure allowed origins in the Function App (Portal → API → CORS, or Azure CLI).

## Build for deployment

```bash
pnpm build
```

This produces `dist/` with the Azure Functions app: `host.json`, `graphql.js`, and `dist/backend/`. Deploy the `dist` folder to your Azure Function App.
