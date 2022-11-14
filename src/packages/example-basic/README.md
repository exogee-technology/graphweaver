# @exogee/graphweaver-example-basic

Example apollo server project that demonstrates `@exogee/graphweaver`

## Set up .env

```dotenv
DATABASE_HOST=
DATABASE_USERNAME=
DATABASE_PASSWORD=
DATABASE_NAME=
```

## Create initial database

```sql
CREATE TABLE "user" ("id" bigserial primary key, "name" text not null);
```

## Start demo server

```sh
$ pnpm start
```

## Test in Apollo Playground

- At http://localhost:4000/
