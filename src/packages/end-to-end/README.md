# Graphweaver End to End Test Suite

This package tests the following:

- Using the CLI to create a new Graphweaver app
- Imports a data source to be used to query
- Makes requests to the API and tests the results

## Database

The database used to run these tests can be found here:

https://github.com/lerocha/chinook-database

The SQLite file has been copied from the above directory and stored in `database.sqlite`.

## To Run Tests

1. Run `pnpm dev` This will start the test server, leave this running to start the tests
2. Run `pnpm test` in another terminal, this will execute the end to end test suite against the server started above
