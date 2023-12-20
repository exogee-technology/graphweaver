// rm -rf ./app
// node ../cli/bin init --name=app --backend=sqlite --useVersion=\"local\"
// cd app
// pnpm i --ignore-workspace --no-lockfile
// mkdir databases
// cp ../databases/database.sqlite databases/database.sqlite
// pnpm run import sqlite --database=databases/database.sqlite --o

import * as fs from 'fs';
import * as path from 'path';
import * as util from 'util';
import { execSync } from 'child_process';

async function removeDirectory(directoryPath: string) {
	if (fs.existsSync(directoryPath)) {
		await fs.promises.rm(directoryPath, { recursive: true });
	}
}

async function copyFile(source: string, destination: string) {
	await fs.promises.mkdir(path.dirname(destination), { recursive: true });
	await fs.promises.copyFile(source, destination);
}

async function main() {
	try {
		await removeDirectory('./app');

		// Create a new instance of the app
		const init = execSync(
			'node ../cli/bin init --name=app --backend=sqlite --useVersion="local"'
		).toString();
		console.log(init);

		// Install dependencies
		process.chdir('./app');
		const pwd = execSync('pwd').toString();
		console.log(pwd);
		const install = execSync('pnpm i --ignore-workspace --no-lockfile').toString();
		console.log(install);

		// Copy the database
		await fs.promises.mkdir('databases');
		await copyFile('../databases/database.sqlite', 'databases/database.sqlite');

		// Import the database
		const runImport = execSync(
			'pnpm run import sqlite --database=databases/database.sqlite --o'
		).toString();
		console.log(runImport);
	} catch (error) {
		console.error('Error:', error);
	}
}

main();
