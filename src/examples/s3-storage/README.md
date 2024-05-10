# S3 Upload Example

This example documents how to integrate with the storage provider package to upload to AWS S3.

For running locally it is handy to have a local S3 env. For this we recommend running:

[https://min.io/docs/minio/macos/index.html](https://min.io/docs/minio/macos/index.html)

Once Minio is installed and start the server with the following command:

`minio server ~/data --address :9002`

Create a new bucket here:

[http://127.0.0.1:54902/browser/add-bucket](http://127.0.0.1:54902/browser/add-bucket)

Update the env variable `AWS_S3_BUCKET` with the new bucket name.

To run the example make sure that you have a local PostgreSQL database and that you seed the database as below.

The user table in PostgreSQL looks like this:

```
CREATE DATABASE gw_storage_provider;

CREATE TABLE "submission" (
  id SERIAL PRIMARY KEY,
  key VARCHAR(255) NOT NULL
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
