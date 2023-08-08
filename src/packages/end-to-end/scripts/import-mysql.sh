rm -rf ./app 
node ../cli/bin init --name=app --backend=mysql --version=\"local\" 
cd app 
pnpm i --ignore-workspace --no-lockfile
mkdir databases
cp ../databases/mysql.sql databases/mysql.sql 
mysql -u root --password=$MYSQL_PASSWORD -e "DROP DATABASE Chinook;"
mysql -u root --password=$MYSQL_PASSWORD -e "CREATE DATABASE Chinook;"
mysql -u root --password=$MYSQL_PASSWORD Chinook < databases/mysql.sql
node ../../cli/bin import mysql --database=Chinook --user=root --password=$MYSQL_PASSWORD --host=localhost --port=3306 