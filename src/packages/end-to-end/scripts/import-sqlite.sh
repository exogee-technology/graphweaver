rm -rf ./app 
node ../cli/bin init --name=app --backend=sqlite --useVersion=\"local\" 
cd app 
pnpm i --ignore-workspace --no-lockfile
mkdir databases
cp ../databases/database.sqlite databases/database.sqlite 
pnpm run import sqlite --database=databases/database.sqlite