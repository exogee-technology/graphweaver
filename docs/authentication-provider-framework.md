# Graphweaver Authentication Provider Framework

## Introduction

In the majority of anticipated cases, we expect that all of the services and backends that Graphweaver will be connected to will need some sort of authentication. Given the nature of the application, we will have to anticipate any number of different methods and protocols can be used, and some clients may even have multiple methods.

However, Graphweaver can be agnostic about most of these details, and will only need to handle a small set of core events and data to be useable. Given its modular approach, particularly with different backend connections and frontend dashboards, it is intended that this same methodology should be applied to authentication and authorization.

The goal of any proposed authentication solution should be to make available a simple interface, into which external modules can be plugged. These pluggable modules (henceforth **PM**s) can be included in the build for a given Graphweaver implementation. We provide a set of core configurations and services within Graphweaver, and also specify the interface that each PM must provide for Graphweaver to use, and either our team or an external team can build a corresponding PM which can handle the complexities of the specific protocols being used.

These can even be open-sourced along with the other FOSS Graphweaver code.



## The SDK

The goal is to build an SDK or API which works as follows:

* Support as many auth providers and mechanisms as possible, but with the specifics being handled by external modules

* Each PM is accompanied by a set of configuration parameters which tell Graphweaver how to use it
* Each PM includes a well-defined interface which allows Graphweaver to handle the essentials of authentication and authorization of requests
* Client tech staff can build their own pluggable authentication components and add them to the system, allowing GW to plug them in, and they set up the configuration which tells GW how to talk to the PM. These can be shared.
* Each client can use more than one PM, associating different methods with different server link endpoints.



## Graphweaver essential requirements

### Connection

Graphweaver should be able to discover whether to present a UI login interface, or to redirect to a client or third-party auth provider. However this should be done through the PM.

### Challenge/Discovery

Graphweaver must be able to detect when a connecting user is **not** authenticated. This can include a client-side check, eg. the absence of a cached token, or a locally-stored token is detectably expired or invalid, which can avoid a trip to the backend to find out. 

Graphweaver must include a server-side check, so that even if an apparently valid and unexpired certificate or token is found, authentication must still be verified at the server.

#### Token lifecycle

In the **OAuth2** case, we will need to handle **ID** tokens (If OICD is being used) and/or **Refresh** tokens as issued by authentication providers to handle logins and authentication checks. We are interested in AP-supplied **access** tokens (possibly separate tokens if OIDC is being used), which the Graphweaver backend will use to authorize requests. 

This complexity can be hidden in the PM. The token, once obtained via login using the PM, can be sent to the backend without review.

In the backend, where it is expected that ACLs, roles etc are set within the schema, we decode the token. In the simplest case we don't manage any sessions. If using JWKS to obtain public keys, for example, we can cache the key obtained and use it to decode incoming JWTs.

Once done we can examine the claims and match role information in the claims against ACLs in the schema. This means that the backend needs to know how to match token roles (or user 'groups') with schema-defined ACLs. We may also want to include a list of users which might require special treatment. 

#### Silent authentication and token renewal

Third party providers (eg. Auth0) also provide an OIDC-compliant 'silent' authentication mechanism, with refresh tokens, which allow for applications to initiate or re-initiate an authentication request directly without any user intervention. This can be used to avoid disruption on long-lasting active sessions.

It should be possible to cover this within the PM itself, as Graphweaver does not need to manage this process.

### Request authorization

Graphweaver will hand the authentication process over to whichever relevant PM has been included or configured by the client. Once the system is satisfied that the user is authenticated, requests will most likely need to be decorated with valid keys/tokens to enable those requests. 

In the case of OAuth2/OIDC, there may be a separate Access Token used to manage requests to the Graphweaver backend. 

In the **SAML** case, where the Graphweaver backend is the SP, enough information should be present in the SAML assertion received from the IdP on authentication to ensure that the SP can validate the existing session. The user agent (frontend) should maintain the SAML session details and pass them to the backend. This means that, in this case, some session management may be required in the backend and therefore need backend configuration.

In some cases we will have configured users in a backend entity, so this can be used as well as the token and schema definitions.

### Third-party requests

During the authorization process, or later, a third party may wish to make an out of band request to Graphweaver as part of the process. This should also be configurable within the SDK.

One possible example is with a SAML session, where a user has initiated a Single Log-Out (SLO) from another SAML session. In this case, the IdP will attempt to contact all logged-in SPs (including Graphweaver) and initiate a logout.

For this reason PM configuration may require that a Graphweaver endpoint is publicly accessible by remote hosts.



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

For each endpoint stub/backend, there should be a corresponding PM and configured mechanism.

### 2. We need to check if authenticated before anything else

Look for any associated authentication payload (**Authorization** header or cookie), or locate any stored information to use for the challenge (Local storage + CSP, API key or token; Certificate; Filesystem file (cf. Example Xero)

### 3. We need to know how to check if a local authentication item is valid

Some public endpoint that we can use to validate the token, from our frontend or backend. In the examples below, the processing at both frontend and backend should be done by the PM.

#### Eg. Auth0 (JWT/OAuth)

1. Look into session storage to see if a token is already present, and check the expiry. If it is absent or expired, assume not logged in and send an **authorize** request to Auth0. This may redirect to an external login page
2. If the token is present, send request to backend with the token.
3. An **authorize** response will be redirected to our configured callback endpoint; if OK, save the token and send request to backend with the token.
4. At the backend, parse the JWT. If necessary, use the configured JWKS + client ID endpoint to do so.
5. Ensure request is authorized. 

#### Failed authentication at backend

Backend responds with a 401 or 403 response. This should be configurable.

### 4. We have a failed authentication response

We need to decide whether the next step is

* Just capture username/password/OTP etc, and forward to an endpoint, or
* Redirect to an external endpoint, or (for example: JWT/OIDC)
* Perform a 'silent' authorization request (using cached token)

For the former we will need the PM config to tell us what data and format it is required in. We can present a generic, configurable Login page in GW, and we can use that to capture the credentials and forward to the PM. The PM config can include details such as the endpoint and possibly M2M tokens to access it.

This endpoint could be the client's own service, which may then in turn redirect to a third party and handle the response, or it could be that third party directly. Either way, the PM must be able to handle and forward the resulting credentials, and also tell us how they should be transmitted with API calls.

### 5. The PM returns with a successful login

Continue with the request - we need the transport mechanism as in (1) above - ie. how (or whether) the authentication token or certificate and/or API token is stored, and how it accompanies each request. 



## Example Implementation: Auth0/SPA/OAuth/JWT

| External Provider | Implementation Type | Strategy                             |
| ----------------- | ------------------- | ------------------------------------ |
| Auth0             | React SPA           | OIDC-conformant OAuth with RS256 JWT |

The Pluggable Module is designed to handle the authentication process in this situation. For a standard SPA solution, we would probably want to use Auth0 React components to protect routes or API calls, integrate with React Router Dom and so on. However, to ensure this is completely pluggable, we would avoid using these and dig lower to retrieve actual tokens etc.

At a bare minimum the following items would need to be included in the solution:

| Parameter or dependency                        | Used by                           | Specification                                                |
| ---------------------------------------------- | --------------------------------- | ------------------------------------------------------------ |
| callback URL*                                  | GW frontend                       | default or configuration param                               |
| logout URL*                                    | PM                                | default or configuration param (optional)                    |
| allowed origin (CORS)* &dagger;                | PM                                | default (*client*.graphweaver.com)                           |
| client subdomain*                              | PM                                | configuration param                                          |
| auth0 domain or custom domain* &dagger;        | PM                                | configuration param                                          |
| auth0 client Id*                               | PM                                | configuration param                                          |
| dependency: `@auth0/auth0-react` or `auth0.js` | PM and/or GW frontend and backend | config: require installation. Also any other deps required by the PM |
| JWT token storage                              | GW frontend                       | eg. LocalStorage with CSP - default or config                |
| Linked backend                                 | GW frontend                       | configuration param                                          |
| login URL (embedded) or login redirect**       | PM                                | configuration param                                          |
| user type                                      | PM and/or GW backend              | optional configuration param - interface declaration (see below) |

\* These items are also set at Auth0. Graphweaver must be an allowed origin under CORS, especially if using an embedded login.

\**Auth0 recommends redirected login, not least because it is more secure, and third-parties such as Google no longer accept embedded logins. 

&dagger; If the client is using Auth0 to manage authentication on another application, and wants to use the same Auth0 application to manage GW authentication with embedded login, then by default the PM will be executing from a different origin from that for which the application has been constructed. This requires extra configuration as GW will be a CORS resource. Unless a custom domain is specified, this may cause problems in browsers which disable third-party cookies by default.

#### Some issues

* If users are available to Graphweaver through a specified entity available in the schema, then this should provide enough info to manage access controls. If there is no User entity, however, it's not immediately clear how users are identified. Auth0's React solution hides a lot of the details. However at a bare minimum users should be identified by email address, as this is used to verify the user by default. On the other hand the client may have configured different methods, so perhaps we should just make it part of the spec that GW agnostically requests an ID string, and the PM provides *something* (eg UUID, simple email address, or something else).

  Use this to configure the local login screen (if using embedded login). If using remote login, the user ID should be available in the JWT `sub` claim.

* In the case of the login with redirection method, the client will handle the landing page completely as it will be hosted by them (or at Auth0 on their behalf). However, for embedded login, we may need further config to pass styling to the PM to handle the login component.

#### Pluggable Module activities

The Pluggable Module will receive the Auth0 context and manage the authorize call. GW frontend can handle the callback, passing the returned JWT to the backend (which may store it in the session). The PM should be stateless (other than what is managed by Auth0 React), and so should not need to intercept the callback.

The PM should also handle the complexity of whether the login is embedded or via redirection to Auth0 or the client's custom domain. 

The PM should handle renewals and 'silent' auth calls as required, perhaps using its own storage for ID and request tokens.



## Example Implementation: Auth0/SPA/Passwordless/Token

| External Provider | Implementation Type | Strategy                             |
| ----------------- | ------------------- | ------------------------------------ |
| Auth0             | React SPA           | Email or SMS; OTP code or magic link |

This method may require an allowable CORS or custom domain configuration. It works using direct `POST` calls to a specific endpoint. 

Also, this only works if we have prior access to a Users entity holding associated connection types (email addresses or phone numbers). 

There are two ways to implement this. The simplest is for the PM to redirect to an external page where the unauthenticated user performs login and handles the SMS or email code or magic link, then the external page arranges for the token to be transmitted back to the PM for forwarding to GW.

The more complex case is where GW itself throws up a page requesting username and email/SMS, and requests that the PM call the provider and return with the token.

Minimum configuration:

| Parameter or dependency                        | Used by | Specification                         |
| ---------------------------------------------- | ------- | ------------------------------------- |
| callback URL* | GW frontend | default or configuration param |
| remote login page location/method (eg `POST`)* | PM      | configuration param                   |
| Auth0 domain or custom domain** &dagger;       | PM      | configuration param                   |
| Auth0 client ID** &dagger;                     | PM      | configuration param                   |
| connection method (email or SMS)**             | PM/GW frontend | configuration param                   |
| send (code or URL)**                           | PM/GW frontend | configuration param                   |
| JWT token storage                              | GW (backend) | eg. LocalStorage with CSP             |
| Linked backend                                 | GW      | configuration param                   |
| local or remote login indicator                | GW frontend | configuration param                   |
| login URL                                      | PM      | configuration param (for local login) |
| user role/type**                            | GW frontend/backend | configuration param; as used by Auth0 |

\* Either a remote login page (which will have to be configured to return the token/HTTP status code), or 

\** all the Auth0 identifiers required for a local request. Use this to configure the local login screen (if using embedded login). If using remote login, the user ID should be available in the JWT `sub` claim. 

&dagger; If the client is using Auth0 to manage authentication on another application, and wants to use the same Auth0 application to manage GW authentication with embedded login, then by default the PM will be executing from a different origin from that for which the application has been constructed. This requires extra configuration as GW will be a CORS resource. Unless a custom domain is specified, this may cause problems in browsers which disable third-party cookies by default.

#### Pluggable Module activities

If the login page is generated locally, GW will use the connection method and send type to configure the login page, and pass the input to the PM, which should manage the passwordless login, and then forward the resulting token back to GW.



## Example Implementation: SAML Direct/Token

| External Provider | Implementation type | Strategy   |
| ----------------- | ------------------- | ---------- |
| External SAML IdP | React SPA           | SAML token |



Although SAML SSO can be managed via a third party mediator such as Auth0, it's possible to set it up for use directly by GW, with the aid of a PM (using `passport-saml` for example).

Minimum configuration with GW as SP (Service Provider):

| Parameter or dependency                        | Used by       | Specification                  |
| ---------------------------------------------- | ------------- | ------------------------------ |
| IdP entry point*                               | PM            | config param                   |
| Issuer ID*                                     | PM            | config param                   |
| Callback (Consumer) URL*                       | PM            | config param                   |
| Certificate*                                   | PM            | config param                   |
| dependencies; eg `passport-saml` and `saml2js` | PM/GW backend | require installation           |
| Token storage                                  | GW backend    | eg. LocalStorage with CSP      |
| Linked backend                                 | GW            | configuration param            |
| Login URL                                      | PM            | config param                   |
| User role/type                                 | GW backend    | config interface param         |
| Callback URL                                   | PM            | Used for IdP-initiated log out |

\* Either also stored at or issued by IdP

#### Pluggable Module activities

Pluggable module will use the login URL to contact the IdP server entrypoint. If the user is not authenticated the IdP will redirect to its login form, and then load the callback URL with the results. The SAML token is XML but can be translated into JSON format using `saml2js` and stored as a normal token.



## Deployment

### Graphweaver built-in PMs

We will be providing a small set of example authentication PMs. What follows is the deployment method for the built-in **Xero Authentication Provider**.

### Client-provided or public PM packages



See https://medium.com/brightlab-techblog/implement-single-sign-on-saml-strategy-with-node-js-passport-js-e8b01ff79cc3

SSO options (with Auth0)

Initial login: Auth0 is Central Server

App redirect to Auth0

Login using un/pw, or OAuth2 &rarr; callback with token

Subseq login: as above but no login required &rarr; callback with token

Check &rarr; silent auth

SAML/WS-Fed

SP = GW (via Auth0) - note this will require a tenant in Auth0

IdP = external

If Auth0 is SP, it will forward a standard JWT to GW.



Options for GW and for 'hiding' from GW

Storage  - httpOnly cookies - have to be set by auth server in such a way that they will be available at the GW backend. The GW backend must have a way to read them (PM) and must know what the auth format is - eg. token etc

Storage - JWT -  stored in GW frontend (or in localstorage using CSP - passed to GW backend using Bearer token header or other method

Refresh/renewal should be performed by PM so we are agnostic about this (and associated tokens)

ID token not used except by PM so again agnostic

expiry/not-before stored on both frontend and backend

access token: options: (1) accessible by GW backend (either via storage or via request header) - use one issued by AS, then backend checks still valid (via PM request to AS) on every call - (upside: secure including where access remotely revoked after token issued; downside: slow) - or (2) throw away AS token, issue our own from backend (signed by our own secret) - then check on every call to backend without ref to AS. upside: fast, downside - will still allow access even if AS token subsequently revoked until token expires.











