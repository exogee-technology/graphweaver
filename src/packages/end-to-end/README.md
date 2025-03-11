# Graphweaver End to End Test Suite

This package tests the following:

- Using the CLI to create a new Graphweaver app
- Imports a data source to be used to query
- Makes requests to the API and tests the results
- Uses complete apps from the `examples` folder

NOTE: Each end to end test scenario has a different approach to preparing a graphweaver app to be tested, and building it in the `app` folder. For example, the `import-rest` step copies an existing, fully baked graphweaver app from the `examples` area. This means that you can modify schema files in that location and then import those changes into the system being tested. On the other hand, the `import-database-sqlite` step uses the approach of generating a graphweaver app from the schema of a database. This means the system being tested will be entirely based on the initial output of the graphweaver generator.

## Database

The database used to run these tests can be found here:

https://github.com/lerocha/chinook-database

The SQLite file has been copied from the above directory and stored in `database.sqlite`.

## To Run Tests: Auth

1. Set up your environment variables. You'll need a public/private ES256 key pair that will be used to sign JWT tokens:

```
# Generate a private key
openssl ecparam -name prime256v1 -genkey -noout -out ecdsa-private-key.pem
# Derive the public key for the private key
openssl ec -in ecdsa-private-key.pem -pubout -out ecdsa-public-key.pem
```

Then, encode the PEM formatted keys as base64 strings:

```
# Output the private key in base64 format
cat ecdsa-private-key.pem | base64
# Output the public key in base64 format
cat ecdsa-public-key.pem | base64
```

Now we're ready to set the environment variables we'll need for the tests:

```console
export AUTH_PRIVATE_KEY_PEM_BASE64="base64_encoded_pem_private_key"
export AUTH_PUBLIC_KEY_PEM_BASE64="base64_encoded_pem_public_key"
export AUTH_BASE_URI="http://localhost:9000"
export AUTH_WHITELIST_DOMAINS="localhost"
export AUTH_MAGIC_LINK_RATE_LIMIT="500"
```

Finally you can kick them off!

```console
pnpm test-auth
```

## To Run Tests: SQLite

1. Run `pnpm dev-sqlite` This will start the test server, leave this running to start the tests
2. Run `pnpm test-sqlite` in another terminal, this will execute the end to end test suite against the server started above

## Pre-requisite: MySQL

Before initiating the MySQL tests, ensure the following prerequisites are met on your local system:

1. MySQL Server: Make sure you have MySQL server installed on your machine. You can download and install MySQL from the official MySQL website.

2. Check mysql Command: Confirm that the 'mysql' command is operational in your terminal. In case you encounter a "mysql: command not found" error, follow the steps below to fix it.
   To add the mysql command to your system's PATH, execute the following command, replacing <mysql_bin_dir> with the actual directory containing the mysql binary:
   export PATH=$PATH:<mysql_bin_dir>

For instance, if your mysql binary is located in the /usr/local/mysql/bin directory, run:
export PATH=$PATH:/usr/local/mysql/bin

Once executed, the "mysql: command not found" error should be resolved, and you can run the mysql command without issues.

3. Environment Variables: You need to have the following environment variables set before running the tests:
   - DATABASE_USERNAME
   - DATABASE_PASSWORD
   - DATABASE_HOST

To set temporary environment variables for your session, execute the following commands in your terminal:
export DATABASE_USERNAME=root
export DATABASE_PASSWORD=root
export DATABASE_HOST=localhost

## To Run Tests: MySQL

1. Run `pnpm dev-mysql` This will start the test server, leave this running to start the tests
2. Run `pnpm test-mysql` in another terminal, this will execute the end to end test suite against the server started above

## Documentation

Comprehensive documentation and usage examples can be found on our [Docs Site](https://graphweaver.com/docs). It covers installation instructions, detailed API documentation, and guides to help you get started with Graphweaver.

## Graphweaver CLI `graphweaver`

The Graphweaver Command Line Interface (CLI) tool enables you to set up and manage Graphweaver using commands in your command-line shell. Check the `graphweaver` npm package [here.](https://www.npmjs.com/package/graphweaver)

## To Run UI Tests

Install the chrome browser using:

`pnpm playwright install --with-deps chromium`

Then

1. Run `pnpm dev-sqlite` This will start the test server, leave this running to start the tests
2. Run `pnpm test-ui` in another terminal, this will execute the end to end test suite against the server started above

To run the recorder use `pnpm playwright codegen`

## Running the Storage Provider End to End tests:

Before running the Storage Provider make sure that you have followed the steps in the Storage Provider Example readme. This will create a local running S3 service and setup a test db.

Once you have this and have created a bucket make sure to configure the `.env` file in the storage provider example (This will get copied across when you run the below scripts).

Once you have setup these pre-requisites you can run the following scripts:

`pnpm import-storage-provider` // this will copy over the example app to the local `./app` directory and use the packed node modules.
`pnpm start-server` // this will start the app from the `./app` directory
`pnpm test-ui-storage-provider` // This will run the playwright UI tests

## Fuzzer

The 'fuzzer' tests are currently under construction. For now, you will need to follow the instructions within and then run the `rest-with-auth` example. These tests do not run in the pipeline yet.
