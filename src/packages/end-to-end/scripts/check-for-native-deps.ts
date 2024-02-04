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

const nativeModules = findFiles(dir, '.node');

if (!nativeModules.length) {
	console.log('No native modules found in production dependencies.');
	process.exit(0);
}

// Looks like some native deps were found, let's describe them to the user
let output = '';
const processedPackageNames = new Set<string>();

nativeModules.forEach((filePath) => {
	console.log('Found native module:', filePath);
	const packageName = extractPackageName(filePath);
	if (!processedPackageNames.has(packageName)) {
		const whyResult = runPnpmWhy(packageName);
		output += `Why ${packageName} exists in the project:` + '\n';
		output += whyResult + '\n\n';
		processedPackageNames.add(packageName);
	}
});

console.log(
	`Found native modules in production dependencies! See the "pnpm why" output below for details:`
);
console.log(output);
process.exit(1);
