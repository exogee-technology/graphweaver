rm -rf .packs
mkdir -p .packs

pnpm build
pnpm packages:pack