# SQLite Example Graphweaver Project

This project was created by introspecting the [Chinook database](https://github.com/lerocha/chinook-database).

## Running Locally

To run SQL Server in a docker on a mac, you can do the following:

```bash
$ docker pull mcr.microsoft.com/mssql/server:2022-latest
$ docker run -e "ACCEPT_EULA=Y" -e "MSSQL_SA_PASSWORD=[choose_a_password_here]" -p 1433:1433 --name sql1 --hostname sql1 -d mcr.microsoft.com/mssql/server:2022-latest
```

Then pass the password you chose to Graphweaver as follows:

```bash
$ DATABASE_PASSWORD=[choose_a_password_here] pnpm start
```
