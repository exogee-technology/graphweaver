import { readdirSync, statSync, existsSync } from 'fs';
import { join, extname } from 'path';

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

const dir = './app/node_modules';

if (!existsSync(dir)) {
	console.log(
		`${dir} directory does not exist. Please run pnpm test-build or one of the pnpm dev-* commands first (to create a test app) then run this command again`
	);
}

const nativeModules = findFiles(dir, '.node');
if (nativeModules.length > 0) {
	console.log(
		'Found native modules files! Please run a "pnpn why" on the package names to find the relevant dependency'
	);
	console.log(nativeModules.join('\n'));
	process.exit(1);
}
