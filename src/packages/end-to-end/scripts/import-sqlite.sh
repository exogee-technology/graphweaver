mkdir app/databases
cp ./databases/database.sqlite ./app/databases/database.sqlite 
cd app 
node ../../cli/bin import sqlite --database=databases/database.sqlite