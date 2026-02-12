rm -rf ./app 
node ./local_modules/graphweaver/bin init --name=app --backend=mysql --useVersion=\"local\" 
cd app 
pnpm i --ignore-workspace --no-lockfile
mkdir databases
cp ../databases/mysql.sql databases/mysql.sql 
mysql --user=mysql --password=mysql --host=localhost -e "DROP DATABASE IF EXISTS Chinook;"
mysql --user=mysql --password=mysql --host=localhost -e "CREATE DATABASE Chinook;"
mysql --user=mysql --password=mysql --host=localhost Chinook < databases/mysql.sql
pnpm run import mysql --database=Chinook --user=mysql --password=mysql --host=localhost --port=3306 --clientGeneratedPrimaryKeys=true --o
pnpm build