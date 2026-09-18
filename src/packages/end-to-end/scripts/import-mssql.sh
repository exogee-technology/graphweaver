rm -rf ./app
node ./local_modules/graphweaver/bin init --name=app --backend=mssql --useVersion=\"local\"
cd app
pnpm i --ignore-workspace --no-lockfile
pnpm run import mssql --database=Chinook --user=sa --password=Graphweaver1! --host=localhost --port=1433 --o
pnpm build
