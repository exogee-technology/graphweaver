#!/bin/bash

# Stop on errors
set -e

# Save the current directory, we'll need this later
SCRIPTS_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd )"
# Define a few more directories we will use
SRC_DIR=$SCRIPTS_DIR/../../..
END_TO_END_DIR=$SRC_DIR/packages/end-to-end
APP_DIR=$END_TO_END_DIR/app
STANDALONE_TEST_APP_DIR=$SRC_DIR/../standalone-test-app

# Make sure all directories are valid
cd $SCRIPTS_DIR
cd $SRC_DIR
cd $END_TO_END_DIR
mkdir -p $STANDALONE_TEST_APP_DIR
cd $STANDALONE_TEST_APP_DIR
cd $APP_DIR

# Almost ready, before we start, define cleanup procedure
cleanup() {
    killall node
	rm -rf $STANDALONE_TEST_APP_DIR
	echo "Standalone end-to-end test exited with status $?"
}

# Execute cleanup on script exit
trap cleanup EXIT

# Now let's go

# Go to src/
cd $SRC_DIR
echo "Starting in src/ directory:"
pwd
# First build graphweaver
pnpm i
pnpm build
# Create the end-to-end test app/ directory and graphweaver import the 'postgres' database in the local Postgres instance
cd $END_TO_END_DIR
pnpm import-database-postgres
# Check the app successfully builds
cd $APP_DIR
pnpm build
# Now go back out and copy the build output into the app-123 directory 
cd $SCRIPTS_DIR
echo "Currently in scripts directory:"
pwd
cp -r $APP_DIR/.graphweaver/* $STANDALONE_TEST_APP_DIR
# Overwrite the backend bundle with the built version that has bundled deps correctly
cp -r $APP_DIR/dist/* $STANDALONE_TEST_APP_DIR
# Add a serverless offline config so that we can run the API using the serverless package
cp $SCRIPTS_DIR/configs/serverless._js $STANDALONE_TEST_APP_DIR/serverless.js
# All done, now let's go into the standalone-test-app directory and run the API and UI tests
cd $STANDALONE_TEST_APP_DIR
echo "Now in standalone test app directory:"
pwd
# Create a PNPM project so that we can use serverless offline and http-server
pnpm init
pnpm add serverless serverless-offline http-server
# Let's prepare the Postgres database
cd $END_TO_END_DIR
pnpm seed-postgres:reseed
cd $STANDALONE_TEST_APP_DIR
# We should be all set, run the UI test suite
pnpm serverless offline start & echo "Let's wait a few seconds for things to load..." && sleep 5
cd $END_TO_END_DIR
echo "Run backend tests..."
pnpm test-postgres 
echo "Backend tests complete."
echo "Stop the backend process..."
killall node
echo "Reset the database..."
cd $END_TO_END_DIR
pnpm seed-postgres:reseed
cd $STANDALONE_TEST_APP_DIR
echo "Database reset complete."
echo "Start the backend and frontend..."
pnpm serverless offline start & pnpm http-server ./admin-ui/ -p 9000 -c-1 & echo "Let's wait a few seconds for things to load..." && sleep 5
echo "Run the frontend tests..."
cd $END_TO_END_DIR
pnpm test-ui:postgres
echo "Frontend tests complete."
# All done, cleanup will run automatically