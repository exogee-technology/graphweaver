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
	const output = execSync(command, { cwd: './app' }).toString().trim();
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

// Let's check if any of the modules that were found are linked to production dependencies
let output = '';
let foundProdNativeModules = false;

packagesWithNativeModules.forEach((packageName) => {
	const whyResult = runPnpmWhy(packageName);
	// If the result is blank, it means the package is not linked to a production dependency
	if (whyResult) {
		console.log('Found package containing native module:', packageName);
		output += `Why ${packageName} exists in the project:` + '\n';
		output += whyResult + '\n\n';
		foundProdNativeModules = true;
	}
});

if (foundProdNativeModules) {
	console.log(
		`Found native modules in production dependencies! See the "pnpm why" output below for details:`
	);
	console.log(output);
	process.exit(1);
} else {
	console.log('No native modules found in production dependencies.');
	process.exit(0);
}
