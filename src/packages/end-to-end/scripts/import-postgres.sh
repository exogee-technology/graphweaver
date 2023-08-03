rm -rf ./app 
node ../cli/bin init --name=app --backend=\"postgres\" --version=\"local\" --host=localhost --user=postgres --password=postgres --port=5432 
cd app 
pnpm i --ignore-workspace --no-lockfile
mkdir app/databases
cp ./databases/postgres.sql ./app/databases/postgres.sql 
cd app 
node ../../cli/bin import postgresql --database=gw --user=postgres --password=postgres --host=localhost --port=5432 