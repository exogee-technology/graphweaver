rm -rf ./app 
node ../cli/bin init --name=app --useVersion=\"local\" 
cd app 
pnpm link ../../auth
pnpm i --ignore-workspace --no-lockfile
pnpm build