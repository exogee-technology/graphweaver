rm -rf packs
mkdir -p packs/@exogee

pnpm build
pnpm packages:pack

# Loop through packs dir and extract the tarballs renaming the directory to the package name
for file in packs/*.tgz; do
	tar -xzf $file -C packs
	rm $file
	# Read the package.json name and use it to rename the package directory
	package=$(jq -r '.name' packs/package/package.json)
	mv packs/package packs/$package
done