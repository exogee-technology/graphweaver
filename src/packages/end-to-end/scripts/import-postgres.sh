rm -rf ./app 
node ./local_modules/graphweaver/bin init --name=app --backend=postgres --useVersion=\"local\" 
cd app 
pnpm i --ignore-workspace --no-lockfile
pnpm run import postgresql --database=gw --user=postgres --password=postgres --host=localhost --port=5432 --clientGeneratedPrimaryKeys=true --o
pnpm build