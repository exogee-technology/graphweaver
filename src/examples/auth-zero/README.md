# Auth Zero Example Graphweaver Project

This example uses the Sqlite example as a base and adds Auth0 Login.

## Making Database changes

To create a new sqlite database from the sql found in `./databases/database.sql`, run the following command

`cat databases/database.sql | sqlite3 databases/database.sqlite`

## Auth0 Configuration

In order to run this example head over to Auth0 and create a new application:

https://manage.auth0.com/dashboard/us/applications

Once you have created the application make sure to set the below settings:

Allowed Callback Urls: http://localhost:9000
Allowed Logout Urls: http://localhost:9000
Allowed Web Origins: http://localhost:9000

In the Global Auth0 settings make sure to have a default Audience:

https://manage.auth0.com/dashboard/us/<AUTH_ZERO_DOMAIN>/tenant/general

Lastly, setup the following env vars:

```
AUTH_JWKS_URI="https://<THE_AUTH0_DOMAIN>/.well-known/jwks.json"
AUTH_JWT_ALGORITHM="RS256"
VITE_AUTH_ZERO_DOMAIN=<THE_AUTH0_DOMAIN>
VITE_AUTH_CLIENT_ID=<THE_AUTH0_CLIENT_ID>
```
