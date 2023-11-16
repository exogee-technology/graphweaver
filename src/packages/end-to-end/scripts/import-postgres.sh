rm -rf ./app 
node ../cli/bin init --name=app --backend=postgres --useVersion=\"local\" 
cd app 
pnpm i --ignore-workspace --no-lockfile
node ../../cli/bin import postgresql --database=gw --user=postgres --password=postgres --host=localhost --port=5432 --o