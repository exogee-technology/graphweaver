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
	console.log('Extracted package name:', path, packageName);
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
let output = '';

nativeModules.forEach((filePath) => {
	const packageName = extractPackageName(filePath);
	const whyResult = runPnpmWhy(packageName);
	if (whyResult) {
		output += `Why ${packageName} exists in the project:`;
		output += whyResult + '\n\n';
	}
});

if (output) {
	console.log(
		`Found native modules in production dependencies! See the "pnpm why" output below for details:`
	);
	console.log(output);
	process.exit(1);
} else {
	// No native modules found, hurrah!
	process.exit(0);
}
