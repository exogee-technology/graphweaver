import * as fs from 'fs';
import * as path from 'path';
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
		execSync('pwd', { stdio: 'inherit' });
		await removeDirectory('./app');

		// Create a new instance of the app
		execSync(
			'node ./local_modules/graphweaver/bin init --name=app --backend=sqlite --useVersion="local"',
			{ stdio: 'inherit' }
		);

		// Create .env file
		const env = `DATABASE=sqlite`;
		await fs.promises.writeFile('.env.sqlite', env);

		// Install dependencies
		process.chdir('./app');
		execSync('pwd', { stdio: 'inherit' });
		execSync('pnpm i --ignore-workspace --no-lockfile', { stdio: 'inherit' });

		// Copy the database
		await fs.promises.mkdir('databases');
		await copyFile('../databases/database.sqlite', 'databases/database.sqlite');

		// Import the database
		execSync('pnpm run import sqlite --database=databases/database.sqlite --o', {
			stdio: 'inherit',
		});

		// Build the app
		execSync('pnpm build', { stdio: 'inherit' });
	} catch (error) {
		console.error('Error:', error);
	}
}

main();
