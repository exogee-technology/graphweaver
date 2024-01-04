rm -rf ./app 
node ../cli/bin init --name=app --useVersion=\"local\" --backend=rest
cd app 
pnpm link ../../auth
pnpm i --ignore-workspace --no-lockfile
pnpm build