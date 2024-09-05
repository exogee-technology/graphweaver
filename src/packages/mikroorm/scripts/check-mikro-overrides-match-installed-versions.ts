// We're fine with require() in this file.
/* eslint-disable @typescript-eslint/no-require-imports */
const packageVersion = require('../package.json').devDependencies['@mikro-orm/core'];
const overrideVersion = require('../../../package.json').pnpm.overrides['@mikro-orm/core'];

console.log(
	`Checking @mikro-orm/core version. Installed: '${packageVersion}', Overridden: '${overrideVersion}'`
);

if (packageVersion !== overrideVersion) {
	throw new Error('@mikro-orm/core version mismatch.');
} else {
	console.log('Success: versions match.');
}
