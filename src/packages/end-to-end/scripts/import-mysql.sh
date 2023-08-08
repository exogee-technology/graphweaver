rm -rf ./app 
node ../cli/bin init --name=app --backend=mysql --version=\"local\" 
cd app 
pnpm i --ignore-workspace --no-lockfile
mkdir databases
cp ../databases/mysql.sql databases/mysql.sql 
mysql -h$DATABASE_HOST -u$DATABASE_USERNAME --password=$DATABASE_PASSWORD -e "DROP DATABASE IF EXISTS Chinook;"
mysql -h$DATABASE_HOST -u$DATABASE_USERNAME --password=$DATABASE_PASSWORD -e "CREATE DATABASE Chinook;"
mysql -h$DATABASE_HOST -u$DATABASE_USERNAME --password=$DATABASE_PASSWORD Chinook < databases/mysql.sql
node ../../cli/bin import mysql --database=Chinook --user=$DATABASE_USERNAME --password=$DATABASE_PASSWORD --host=$DATABASE_HOST --port=3306 