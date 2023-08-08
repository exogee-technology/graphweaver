rm -rf ./app 
node ../cli/bin init --name=app --backend=mysql --version=\"local\" 
cd app 
pnpm i --ignore-workspace --no-lockfile
mkdir databases
cp ../databases/mysql.sql databases/mysql.sql 
mysql -hlocalhost -u $MYSQL_USER --password=$MYSQL_PASSWORD -e "DROP DATABASE IF EXISTS Chinook;"
mysql -hlocalhost -u $MYSQL_USER --password=$MYSQL_PASSWORD -e "CREATE DATABASE Chinook;"
mysql -hlocalhost -u $MYSQL_USER --password=$MYSQL_PASSWORD Chinook < databases/mysql.sql
mysql -hlocalhost -u $MYSQL_USER --password=$MYSQL_PASSWORD -e "CREATE USER IF NOT EXISTS 'tester'@'localhost' IDENTIFIED BY 'password';"
mysql -hlocalhost -u $MYSQL_USER --password=$MYSQL_PASSWORD -e "GRANT ALL ON Chinook.* TO 'tester'@'localhost';"
mysql -hlocalhost -u $MYSQL_USER --password=$MYSQL_PASSWORD -e "FLUSH PRIVILEGES;"
node ../../cli/bin import mysql --database=Chinook --user=tester --password=password --host="127.0.0.1" --port=3306 