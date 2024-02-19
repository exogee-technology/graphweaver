import * as fs from 'fs';
import * as path from 'path';
import { exec } from 'promisify-child-process';

async function removeDirectory(directoryPath: string) {
	if (fs.existsSync(directoryPath)) {
		await fs.promises.rm(directoryPath, { recursive: true });
	}
}

async function copyFile(source: string, destination: string) {
	await fs.promises.mkdir(path.dirname(destination), { recursive: true });
	await fs.promises.copyFile(source, destination);
}

async function execAsync(command: string) {
	const child = exec(command);
	child.stdout?.on('data', (data) => {
		console.log(data);
	});
	child.stderr?.on('data', (data) => {
		console.error(data);
	});
	return child;
}

async function main() {
	try {
		await execAsync('pwd');
		await removeDirectory('./app');

		// Create a new instance of the app
		await execAsync(
			'node ./local_modules/graphweaver/bin init --name=app --backend=sqlite --useVersion="local"'
		);

		// Create .env file
		const env = `DATABASE=sqlite`;
		await fs.promises.writeFile('.env.sqlite', env);

		// Install dependencies
		process.chdir('./app');
		await execAsync('pwd');
		await execAsync('pnpm i --ignore-workspace --no-lockfile');

		// Copy the database
		await fs.promises.mkdir('databases');
		await copyFile('../databases/database.sqlite', 'databases/database.sqlite');

		// Import the database
		await execAsync('pnpm run import sqlite --database=databases/database.sqlite --o');
	} catch (error) {
		console.error('Error:', error);
	}
}

main();
