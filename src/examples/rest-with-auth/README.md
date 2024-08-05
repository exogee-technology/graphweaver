# REST with MySql Database and Auth

It is possible to connect a database and an external REST API to Graphweaver and expose the data via the GraphQL API.

This example demonstrates how to do that with MySQL and the Star Wars API and how to setup Authentication.

To run the example make sure that you have a local MySQL database and that you seed the database with:

`pnpm import-database`

## Authorization

This example also demonstrates the use of the auth library.

Firstly, create a public/private ES256 key pair that will be used to sign JWT tokens:

```sh
# Generate a private key
openssl ecparam -name prime256v1 -genkey -noout -out ecdsa-private-key.pem
# Derive the public key for the private key
openssl ec -in ecdsa-private-key.pem -pubout -out ecdsa-public-key.pem
```

Then, encode the PEM formatted keys as base64 strings:

```sh
# Output the private key in base64 format
cat ecdsa-private-key.pem | base64
# Output the public key in base64 format
cat ecdsa-public-key.pem | base64
```

Copy the base64-formatted values into your .env file:

```sh
AUTH_PUBLIC_KEY_PEM_BASE64="base64_encoded_pem_public_key"
AUTH_PRIVATE_KEY_PEM_BASE64="base64_encoded_pem_private_key"
```

You will be able to log in using one of the following credentials:

```javascript
    { username: 'luke', password: 'lightsaber123' },
    { username: 'darth', password: 'deathstar123' },
```

## Start a local development server

Once the database is up and running, you can start the example with:

```sh
pnpm i
pnpm start
```

## Making a request via APIKey

After generating an API key via the adminUI, taking note of the secret as the API key is created, you can use this to make a request to a Graphweaver server.
Encode the `<key>:<secret>` in Base64 following Basic Access Authentication. Using that, you can make a curl request, ex:

```sh
curl --location 'http://localhost:9001/' \
--header 'x-api-key: <your-encoded-key>' \
--header 'Content-Type: application/json' \
--data '{"query":"query {\n    tasks {\n        id\n    }\n}","variables":{}}'
```
