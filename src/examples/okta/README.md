# Microsoft Entra Example Graphweaver Project

This example uses the Sqlite example as a base and adds Microsoft Entra Login.

## Making Database changes

To create a new sqlite database from the sql found in `./databases/database.sql`, run the following command

`cat databases/database.sql | sqlite3 databases/database.sqlite`

## Microsoft Entra Configuration

### Create App Registration

In order to run this example, head over to Entra and create a new application:
https://entra.microsoft.com/#view/Microsoft_AAD_RegisteredApps/ApplicationsListBlade/quickStartType~/null/sourceType/Microsoft_AAD_IAM

Configure the values as follows:

- Name: [What you'd like to call this application]
- Redirect URI: Single-page application (SPA) platform, http://localhost:9000/auth/login

### Fix Invalid JWTs

Sadly, Entra is not compliant with the OIDC specification by default. They add a `nonce` claim to the
JWT header, which means the JWT no longer passes signature verification. You can read more about it here: https://xsreality.medium.com/making-azure-ad-oidc-compliant-5734b70c43ff

To fix the JWTs so they'll pass verification, we'll need to add a custom claim. This makes it so that when users log in, the token given by Microsoft is standards compliant.

1. Select the "Expose an API" tab.
2. Click "Add a scope"
3. If the control panel asks you to set an Application ID URI, accept the default by clicking "Save and continue"
4. Choose a Scope name. This can be anything. If you're unsure, you can use `Graphweaver.Login`.
5. Under "Who can consent?" select "Admins and users"
6. Admin consent display name: "Login"
7. Admin consent description: "Allows you to log into the application"
8. Leave "State" set to the default of "Enabled"

Save the custom claim and copy the Scope identifier. It will start with `api://[your application uuid/guid]`. You'll need it for the `.env` file shortly.

Lastly, setup the following env vars:

```
AUTH_BASE_URI="http://localhost:9000"
AUTH_WHITELIST_DOMAINS="localhost"
AUTH_JWT_ALGORITHM="RS256"
VITE_MICROSOFT_ENTRA_CLIENT_ID="YOUR_ENTRA_CLIENT_ID"

# If you're using the `common` tenant, do this:
AUTH_JWKS_URI="https://login.microsoftonline.com/common/discovery/v2.0/keys?appId=[YOUR_CLIENT_ID]"

# Otherwise, do this:
# AUTH_JWKS_URI="https://login.microsoftonline.com/[TENANT_ID]/discovery/v2.0/keys?appId=[YOUR_CLIENT_ID]"
# VITE_MICROSOFT_ENTRA_TENANT_ID="[TENANT_ID]"
```
