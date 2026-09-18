# Environment for the SQL provider's conformance suites, matching docker-compose.sql.yml.
#
# Each package skips rather than fails when its host variable is unset, so sourcing this is what
# turns the server-backed suites on. SQLite needs nothing: it runs in process.
export PGHOST=127.0.0.1
export PGPORT=5432
export PGUSER=postgres
export PGPASSWORD=postgres
export PGDATABASE=graphweaver_sql_test

export MYSQL_HOST=127.0.0.1
export MYSQL_PORT=3306
export MYSQL_USER=root
export MYSQL_PASSWORD=graphweaver
export MYSQL_DATABASE=graphweaver_sql_test

export MSSQL_HOST=127.0.0.1
export MSSQL_PORT=1433
export MSSQL_USER=sa
export MSSQL_PASSWORD='Graphweaver1!'
export MSSQL_DATABASE=graphweaver_sql_test
