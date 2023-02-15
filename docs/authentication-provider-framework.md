# Graphweaver Authentication Provider Framework

## Introduction

In the majority of anticipated cases, we expect that all of the services and backends that Graphweaver will be connected to will need some sort of authentication. Given the nature of the application, we will have to anticipate any number of different methods and protocols can be used, and some clients may even have multiple methods.

However, Graphweaver can be agnostic about most of these details, and will only need to handle a small set of core events and data to be useable. Given its modular approach, particularly with different backend connections and frontend dashboards, it is intended that this same methodology should be applied to authentication and authorization.

The goal of any proposed authentication solution should be to make available a simple interface, into which external modules can be plugged. These plugins can be included in the build for a given Graphweaver implementation. We provide a set of core configurations and services within Graphweaver, and also specify the interface that each plugin must provide for Graphweaver to use, and either our team or an external team can build a corresponding plugin which can handle the complexities of the specific protocols being used.

These can even be open-sourced along with the other FOSS Graphweaver code.



## The SDK

The goal is to build an SDK or API which works as follows:

* Support as many auth providers and mechanisms as possible, but with the specifics being handled by external modules

* Each plugin is accompanied by a set of configuration parameters which tell Graphweaver how to use it
* Each plugin includes a well-defined interface which allows Graphweaver to handle the essentials of authentication and authorization of requests
* Client tech staff can build their own pluggable authentication components and add them to the system, allowing Graphweaver to plug them in, and they set up the configuration which tells Graphweaver how to talk to the plugin. These can be shared.
* Each client can use more than one plugin, associating different methods with different server link endpoints.



## Graphweaver essential requirements

### Connection

Graphweaver should be able to discover whether to present a UI login interface, or to redirect to a client or third-party auth provider. However this should be done through the plugin.

### Challenge/Discovery

Graphweaver must be able to detect when a connecting user is **not** authenticated. This can include a client-side check, eg. the absence of a cached token, or a locally-stored token is detectably expired or invalid, which can avoid a trip to the backend to find out. 

Graphweaver must include a server-side check, so that even if an apparently valid and unexpired certificate or token is found, authentication must still be verified at the server.

#### Token lifecycle

In the **OAuth2** case, we will need to handle **ID** tokens (If OpenID Connect (OIDC) is being used) and/or **Refresh** tokens as issued by authentication providers to handle logins and authentication checks. We are interested in AP-supplied **access** tokens (possibly separate tokens if OIDC is being used), which the Graphweaver backend will use to authorize requests. 

This complexity can be hidden in the plugin. The token, once obtained via login using the plugin, can be sent to the backend without review.

In the backend, where it is expected that ACLs, roles etc are set within the schema, we decode the token. In the simplest case we don't manage any sessions. If using JWKS to obtain public keys, for example, we can cache the key obtained and use it to decode incoming JWTs.

Once done we can examine the claims and match role information in the claims against ACLs in the schema. This means that the backend needs to know how to match token roles (or user 'groups') with schema-defined ACLs. We may also want to include a list of users which might require special treatment. 

#### Silent authentication and token renewal

Third party providers (eg. Auth0) also provide an OIDC-compliant 'silent' authentication mechanism, with refresh tokens, which allow for applications to initiate or re-initiate an authentication request directly without any user intervention. This can be used to avoid disruption on long-lasting active sessions.

It should be possible to cover this within the plugin itself, as Graphweaver does not need to manage this process.

### Request authorization

Graphweaver will hand the authentication process over to whichever relevant plugin has been included or configured by the client. Once the system is satisfied that the user is authenticated, requests will most likely need to be decorated with valid keys/tokens to enable those requests. 

In the case of OAuth2/OIDC, there may be a separate Access Token used to manage requests to the Graphweaver backend. 

In the **SAML** case, where the Graphweaver backend is the Service Provider, enough information should be present in the SAML assertion received from the Identity Provider on authentication to ensure that the Service Provider can validate the existing session. The user agent (frontend) should maintain the SAML session details and pass them to the backend. This means that, in this case, some session management may be required in the backend and therefore need backend configuration.

In some cases we will have configured users in a backend entity, so this can be used as well as the token and schema definitions.

### Third-party requests

During the authorization process, or later, a third party may wish to make an out of band request to Graphweaver as part of the process. This should also be configurable within the SDK.

One possible example is with a SAML session, where a user has initiated a Single Log-Out (SLO) from another SAML session using the same Identity Provider. In this case, the Identity Provider will attempt to contact all logged-in Service Providers (including Graphweaver) and initiate a logout.

For this reason plugin configuration may require that a Graphweaver endpoint is publicly accessible by remote hosts.



## Authentication mechanisms to be supported

* **Transport**: JWT (JWT-only, JWT with JWKS), cookies, other

* **Methods**: WebAuthn, OAuth2, SAML/WS-Fed, AD/LDAP, Username/Password, Basic, OTP, Magic Links

* **External general-purpose providers**: Auth0, Okta, OneLogin, KeyCloak, Amazon Cognito, IdentityServer

* **SAML providers** eg. Google Workspace, Salesforce

* **OAuth providers** eg. Github, JIRA, Xero, Hubspot

The goal is for external pluggable modules to deal with the complexities of each login endpoint.



## Anatomy of the proposed solution

### 1. User sends request to Graphweaver (either a given endpoint or the home page)

Configuration to include the home page or endpoint stub, plus the transport mechanism for the token/API key:

* JWT, Authorization header
* Cookie (can't do anything with this in the browser - will rely on its presence/absence when the user lands; see 401/403 below)

For each endpoint stub/backend, there should be a corresponding plugin and configured mechanism.

### 2. We need to check if authenticated before anything else

Look for any associated authentication payload (**Authorization** header or cookie), or locate any stored information to use for the challenge (Local storage + CSP, API key or token; Certificate; Filesystem file (cf. Example Xero)

### 3. We need to know how to check if a local authentication item is valid

Some public endpoint that we can use to validate the token, from our frontend or backend. Graphweaver will have to look up configuration to locate the correct plugin to handle authentication.

In the examples below, the processing at the frontend should be done by the plugin.

#### Eg. Auth0 (JWT/OAuth)

1. Graphweaver: look up in configuration to see which plugin modules are configured for authentication and select the relevant module.

1. Plugin: Look into request or session storage to see if a token is already present, and check the expiry. If it is absent or expired, assume not logged in and send an **authorize** request to Auth0. This may redirect to an external login page
2. Plugin: If the token is present, forward it back to Graphweaver, which will send the request to backend with the token.
3. Plugin: An **authorize** response will be redirected to our configured callback endpoint; if OK, save the token and forward the token to Graphweaver. Graphweaver: send request to backend with the token.
4. Backend: parse the JWT. If necessary, use the configured JWKS + client ID endpoint to do so.
5. Backend: Ensure request is authorized. This may mean that data and callback function(s) implemented in the plugin should be made available in the context used by the backend. If the backend fails authentication, return 401/403 to the frontend.



### 4. We have a failed authentication response from backend

We need to decide whether the next step is

* Just capture username/password/OTP etc, and forward to an endpoint, or
* Redirect to an external endpoint, or (for example: JWT/OIDC)
* Perform a 'silent' authorization request (using cached token)

For the former we will need the plugin config to tell us what data and format it is required in. We can present a generic, configurable Login page in Graphweaver, and we can use that to capture the credentials and forward to the plugin (==Alternative: make a Login page component accessible within the plugin.==). 

The plugin config can include details such as the endpoint and possibly machine-to-machine tokens to access it.

This endpoint could be the client's own service, which may then in turn redirect to a third party and handle the response, or it could be that third party directly. Either way, the plugin must be able to handle and forward the resulting credentials, and also tell us how they should be transmitted with API calls.

### 5. The plugin returns with a successful login

Graphweaver: Continue with the request - we need the transport mechanism as in (1) above - ie. how (or whether) the authentication token or certificate and/or API token is stored, and how it accompanies each request. 



## Example Implementation: Auth0/SPA/OAuth/JWT

| External Provider | Implementation Type | Strategy                             |
| ----------------- | ------------------- | ------------------------------------ |
| Auth0             | React SPA           | OIDC-conformant OAuth with RS256 JWT |

The plugin is designed to handle the authentication process in this situation. For a standard SPA solution, we would probably want to use Auth0 React components to protect routes or API calls, integrate with React Router Dom and so on. However, to ensure this is completely pluggable, we would avoid using these and dig lower to retrieve actual tokens etc.

At a bare minimum the following items would need to be included in the solution:

| Parameter or dependency                        | Used by                                        | Specification                                                |
| ---------------------------------------------- | ---------------------------------------------- | ------------------------------------------------------------ |
| callback URL*                                  | Graphweaver frontend                           | default or configuration param                               |
| logout URL*                                    | plugin                                         | default or configuration param (optional)                    |
| allowed origin (CORS)* &dagger;                | plugin                                         | default (*client*.graphweaver.com)                           |
| client subdomain*                              | plugin                                         | configuration param                                          |
| auth0 domain or custom domain* &dagger;        | plugin                                         | configuration param                                          |
| auth0 client Id*                               | plugin                                         | configuration param                                          |
| dependency: `@auth0/auth0-react` or `auth0.js` | plugin and/or Graphweaver frontend and backend | config: require installation. Also any other deps required by the plugin |
| JWT token storage                              | Graphweaver frontend                           | eg. LocalStorage with CSP - default or config                |
| Linked backend                                 | Graphweaver frontend                           | configuration param                                          |
| login URL (embedded) or login redirect**       | plugin                                         | configuration param                                          |
| user type                                      | plugin and/or Graphweaver backend              | optional configuration param - interface declaration (see below) |

\* These items are also set at Auth0. Graphweaver must be an allowed origin under CORS, especially if using an embedded login.

\**Auth0 recommends redirected login, not least because it is more secure, and third-parties such as Google no longer accept embedded logins. 

&dagger; If the client is using Auth0 to manage authentication on another application, and wants to use the same Auth0 application to manage Graphweaver authentication with embedded login, then by default the plugin will be executing from a different origin from that for which the application has been constructed. This requires extra configuration as Graphweaver will be a CORS resource. Unless a custom domain is specified, this may cause problems in browsers which disable third-party cookies by default.

#### Some issues

* If users are available to Graphweaver through a specified entity available in the schema, then this should provide enough info to manage access controls. If there is no User entity, however, it's not immediately clear how users are identified. Auth0's React solution hides a lot of the details. However at a bare minimum users should be identified by email address, as this is used to verify the user by default. On the other hand the client may have configured different methods, so perhaps we should just make it part of the spec that Graphweaver agnostically requests an ID string, and the plugin provides *something* (eg UUID, simple email address, or something else).

  Use this to configure the local login screen (if using embedded login). If using remote login, the user ID should be available in the JWT `sub` claim.

* In the case of the login with redirection method, the client will handle the landing page completely as it will be hosted by them (or at Auth0 on their behalf). 

#### Plugin activities

The plugin will receive the Auth0 context and manage the authorize call. Graphweaver frontend can handle the callback, passing the returned JWT to the backend (which may store it in the session). 

The plugin should also handle the complexity of whether the login is embedded or via redirection to Auth0 or the client's custom domain. 

The plugin should handle renewals and 'silent' auth calls as required, perhaps using its own storage for ID and request tokens. For this reason it may not be able to make the plugin stateless.



## Example Implementation: Auth0/SPA/Passwordless/Token

| External Provider | Implementation Type | Strategy                             |
| ----------------- | ------------------- | ------------------------------------ |
| Auth0             | React SPA           | Email or SMS; OTP code or magic link |

This method may require an allowable CORS or custom domain configuration. It works using direct `POST` calls to a specific endpoint. 

Also, this only works if we have prior access to a Users entity holding associated connection types (email addresses or phone numbers). 

There are two ways to implement this. The simplest is for the plugin to redirect to an external page where the unauthenticated user performs login and handles the SMS or email code or magic link, then the external page arranges for the token to be transmitted back to the plugin for forwarding to Graphweaver.

The more complex case is where Graphweaver itself throws up a page requesting username and email/SMS, and requests that the plugin call the provider and return with the token.

Minimum configuration:

| Parameter or dependency                        | Used by | Specification                         |
| ---------------------------------------------- | ------- | ------------------------------------- |
| callback URL* | Graphweaver frontend | default or configuration param |
| remote login page location/method (eg `POST`)* | plugin  | configuration param                   |
| Auth0 domain or custom domain** &dagger;       | plugin  | configuration param                   |
| Auth0 client ID** &dagger;                     | plugin  | configuration param                   |
| connection method (email or SMS)**             | plugin/Graphweaver frontend | configuration param                   |
| send (code or URL)**                           | plugin/Graphweaver frontend | configuration param                   |
| JWT token storage                              | Graphweaver (backend) | eg. LocalStorage with CSP             |
| Linked backend                                 | Graphweaver | configuration param                   |
| local or remote login indicator                | Graphweaver frontend | configuration param                   |
| login URL                                      | plugin  | configuration param (for local login) |
| user role/type**                            | Graphweaver frontend/backend | configuration param; as used by Auth0 |

\* Either a remote login page (which will have to be configured to return the token/HTTP status code), or 

\** all the Auth0 identifiers required for a local request. Use this to configure the local login screen (if using embedded login). If using remote login, the user ID should be available in the JWT `sub` claim. 

&dagger; If the client is using Auth0 to manage authentication on another application, and wants to use the same Auth0 application to manage Graphweaver authentication with embedded login, then by default the plugin will be executing from a different origin from that for which the application has been constructed. This requires extra configuration as Graphweaver will be a CORS resource. Unless a custom domain is specified, this may cause problems in browsers which disable third-party cookies by default.

#### Plugin activities

If the login page is generated locally, Graphweaver will use the connection method and send type to configure the login page, and pass the input to the plugin, which should manage the passwordless login, and then forward the resulting token back to Graphweaver.



## Example Implementation: SAML Direct/Token

| External Provider               | Implementation type | Strategy   |
| ------------------------------- | ------------------- | ---------- |
| External SAML Identity Provider | React SPA           | SAML token |

See [Implement SSO SAML strategy with nodeJS passport.js](https://medium.com/brightlab-techblog/implement-single-sign-on-saml-strategy-with-node-js-passport-js-e8b01ff79cc3)

Although SAML SSO can be managed via a third party mediator such as Auth0, it's possible to set it up for use directly by Graphweaver, with the aid of a plugin (using `passport-saml` for example).

Minimum configuration with Graphweaver as Service Provider:

| Parameter or dependency                        | Used by                    | Specification                                |
| ---------------------------------------------- | -------------------------- | -------------------------------------------- |
| Identity Provider entry point*                 | plugin                     | config param                                 |
| Issuer ID*                                     | plugin                     | config param                                 |
| Callback (Consumer) URL*                       | plugin                     | config param                                 |
| Certificate*                                   | plugin                     | config param                                 |
| dependencies; eg `passport-saml` and `saml2js` | plugin/Graphweaver backend | require installation                         |
| Token storage                                  | Graphweaver backend        | eg. LocalStorage with CSP                    |
| Linked backend                                 | Graphweaver                | configuration param                          |
| Login URL                                      | plugin                     | config param                                 |
| User role/type                                 | Graphweaver backend        | config interface param                       |
| Callback URL                                   | plugin                     | Used for Identity Provider-initiated log out |

\* Either also stored at or issued by Identity Provider

#### Plugin activities

The plugin will use the login URL to contact the Identity Provider server entrypoint. If the user is not authenticated the Identity Provider will redirect to its login form, and then load the callback URL with the results. The SAML token is XML but can be translated into JSON format using `saml2js` and stored as a normal token.



## Example Implementation: Amazon Cognito

| External Provider          | Implementation type | Strategy   |
| -------------------------- | ------------------- | ---------- |
| Amazon Cognito (User Pool) | React SPA           | SAML token |

An example of an implementation which uses Cognito for authentication only, and all authorization is managed in Graphweaver using a Users entity.

| Parameter or dependency                       | Used by             | Specification             |
| --------------------------------------------- | ------------------- | ------------------------- |
| Cognito Pool entry point*                     | plugin              | config param              |
| User Pool ID                                  | plugin              | config param              |
| Client ID                                     | plugin              | config param              |
| Region                                        | plugin              | config param              |
| Domain                                        | plugin              | config param              |
| dependencies; eg `amazon-cognito-identity-js` | plugin              | require installation      |
| Token/Session storage                         | Graphweaver backend | eg. LocalStorage with CSP |
| Linked backend                                | Graphweaver         | configuration param       |

\* If required; may be 'hidden' in dependencies.

#### Plugin activities

The plugin will need to handle Cognito sign-in and management of ID and access tokens, including password expiry. 



## Deployment

### Graphweaver built-in plugins

We will be providing a small set of example authentication plugins. What follows is the deployment method and proposed flows for the built-in **Xero Authentication Provider**.

* Include the plugin module in a subfolder in *`[implementation]`*`/src/admin-ui/auth`[^1]

* In the `vite-plugin-graphweaver` package: Add a loader function to inject an `authHandlers` export for the authentication plugins.

* Create a function to define a virtual module `virtual:graphweaver-auth-plugins` and to call the loader function, and add a call to this function to the `plugins` list in `vite-config.ts`

* Include configurations for the plugins in  `/graphweaver-config.ts` (these are also visible in `cli/src/build/backend.ts`)

* Ensure the virtual module `virtual:graphweaver-auth-plugins` is included in the `external` list for **esbuild**

* Export the `authHandlers` object in *`[implementation]`*`/src/admin-ui/auth/index.ts(x)`. This should be the array of plugin object definitions and configuration parameters, so that Graphweaver knows which plugins to use with which incoming requests.

* Import the plugins from `virtual:graphweaver-auth-plugins` in use.

  [^1]: Currently, in the example app `example-xero`, the dashboards are in the folder `example-xero/src/dashboards`. This should be moved to `example-xero/src/admin-ui/dashboards` alongside the `auth` folder.

  

### Client-provided or public plugin packages

The above solution should work the same for external plugins, if they are included in/exported from the same `auth` subfolder.



