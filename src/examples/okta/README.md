# Okta Example Graphweaver Project

This example uses the Sqlite example as a base and adds Okta Login.

## Making Database changes

To create a new sqlite database from the sql found in `./databases/database.sql`, run the following command

`cat databases/database.sql | sqlite3 databases/database.sqlite`

## Okta Configuration

### Create App Registration

In order to run this example, head over to Okta and create a new application.

Configure the values as follows:

- Name: [What you'd like to call this application]
- Type: Single Page App (SPA)
- Sign In Redirect URIs: http://localhost:9000/auth/login
- Sign Out Redirect URIs: http://localhost:9000

Take note of the client ID and your Okta domain. For example if your admin panel is at `https://trial-123456-admin.okta.com/`, then your Okta domain is `trial-123456.okta.com`.

Copy the `.env.example` file to `.env` and fill in the values as above.

Start!
