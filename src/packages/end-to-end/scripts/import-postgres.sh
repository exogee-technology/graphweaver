mkdir app/databases
cp ./databases/postgres.sql ./app/databases/postgres.sql 
cd app 
node ../../cli/bin import postgresql --database=databases/postgres.sql