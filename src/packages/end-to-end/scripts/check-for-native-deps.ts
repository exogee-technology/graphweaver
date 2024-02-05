import { readdirSync, statSync, existsSync } from 'fs';
import { join, extname } from 'path';
import { execSync } from 'child_process';

const findFiles = (dir: string, ext: string, fileList: string[] = []) => {
	const files = readdirSync(dir);

	files.forEach((file) => {
		const filePath = join(dir, file);
		const stat = statSync(filePath);

		if (stat.isDirectory()) {
			findFiles(filePath, ext, fileList);
		} else if (extname(file) === ext) {
			fileList.push(filePath);
		}
	});

	return fileList;
};

const extractPackageName = (path: string) => {
	const splitPath = path.split('/');
	const lastNodeModulesIndex = splitPath.lastIndexOf('node_modules');
	const packageName = splitPath[lastNodeModulesIndex + 1];
	return packageName;
};

const runPnpmWhy = (packageName: string) => {
	const command = `pnpm why -r -P ${packageName}`;
	const output = execSync(command, { cwd: './app' }).toString();
	return output;
};

// This is the root node_modules directory for the built standalone app
const dir = './app/node_modules';

if (!existsSync(dir)) {
	console.log(
		`${dir} directory does not exist. Please run pnpm test-build or one of the pnpm dev-* commands first (to create a test app) then run this command again`
	);
	process.exit(0);
}

// We support SQLite mainly for internal testing purposes, but it does use native modules. Let's ignore for this test
const allowList = new Set(['sqlite3', 'better-sqlite3']);

const packagesWithNativeModules = new Set(
	findFiles(dir, '.node')
		.map((module) => extractPackageName(module))
		.filter((pkg) => !allowList.has(pkg))
);

if (!packagesWithNativeModules.size) {
	console.log('No native modules found in production dependencies.');
	process.exit(0);
}

// Looks like some native deps were found, let's describe them to the user
let output = '';

packagesWithNativeModules.forEach((packageName) => {
	console.log('Found package containing native module:', packageName);
	const whyResult = runPnpmWhy(packageName);
	output += `Why ${packageName} exists in the project:` + '\n';
	output += whyResult + '\n\n';
});

console.log(
	`Found native modules in production dependencies! See the "pnpm why" output below for details:`
);
console.log(output);
process.exit(1);
