# S3 Upload Example

This example documents how to integrate with the storage provider package to upload to AWS S3.

For running locally it is handy to have a local S3 env. For this we recommend running:

[https://min.io/docs/minio/macos/index.html](https://min.io/docs/minio/macos/index.html)

Once Minio is installed and start the server with the following command:

`minio server ~/data --address :9002`

Create a new bucket here:

[http://127.0.0.1:54902/browser/add-bucket](http://127.0.0.1:54902/browser/add-bucket)

Update the env variable `AWS_S3_BUCKET` with the new bucket name.

Lastly, you need to create a user and access id / secret:

[http://127.0.0.1:54902/identity/users](http://127.0.0.1:54902/identity/users)

Save these values to the `AWS_ACCESS_KEY_ID` and `AWS_SECRET_ACCESS_KEY` env vars.

To run the example make sure that you have a local PostgreSQL database and that you seed the database as below.

The user table in PostgreSQL looks like this:

```
CREATE DATABASE gw_storage_provider;

CREATE TABLE "submission" (
  id SERIAL PRIMARY KEY,
  image jsonb
);

```

Once the database is up and running make sure to set the values in the .env file by:

`cp ./env.example .env`

Then updating the db connection strings.

You can start the example with:

```
pnpm i
pnpm start
```

## Using with Localstack

```
brew install localstack/tap/localstack-cli
SERVICES=s3 DISABLE_CUSTOM_CORS_S3=1 DISABLE_CORS_CHECKS=1 localstack start
aws configure set aws_access_key_id localstack
aws configure set aws_secret_access_key localstack
aws configure set default.region us-east-1
```

Create Bucket:
`aws s3 mb s3://test --endpoint-url=http://s3.us-east-1.localhost.localstack.cloud:4566`

List Bucket:
`aws s3 ls s3://test --endpoint-url=http://s3.us-east-1.localhost.localstack.cloud:4566`
