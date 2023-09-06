# Graphweaver End to End Test Suite

This package tests the following:

- Using the CLI to create a new Graphweaver app
- Imports a data source to be used to query
- Makes requests to the API and tests the results

## Database

The database used to run these tests can be found here:

https://github.com/lerocha/chinook-database

The SQLite file has been copied from the above directory and stored in `database.sqlite`.

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

`npx playwright install --with-deps chromium`

Then

1. Run `pnpm dev-sqlite` This will start the test server, leave this running to start the tests
2. Run `pnpm test-ui` in another terminal, this will execute the end to end test suite against the server started above
