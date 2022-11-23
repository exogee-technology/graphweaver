# GraphWeaver - Complex Example

To start this project you need several things:

- `pnpm i`
- Run a Postgres server locally.
- Create a database called `graphweaver`.
- Create the following table (migrations coming soon):

```sql
CREATE TABLE session (
	session_token varchar(255) NOT NULL,
	expires_at timestamptz(0) NOT NULL,
	value jsonb NULL
);
```
