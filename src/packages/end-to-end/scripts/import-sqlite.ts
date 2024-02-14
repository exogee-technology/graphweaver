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

async function copyDirectory(source: string, destination: string) {
	await fs.promises.cp(source, destination, { recursive: true, force: true });
}

async function main() {
	try {
		process.chdir('../../');

		execSync('pnpm publish:local', { stdio: 'inherit' });
		await fs.promises.mkdir(path.join('./packs/graphweaver/node_modules'), { recursive: true });
		await copyDirectory('./packs/@exogee', './packs/graphweaver/node_modules/@exogee');
		await copyDirectory(
			'./packs/vite-plugin-graphweaver',
			'./packs/graphweaver/node_modules/vite-plugin-graphweaver'
		);

		process.chdir('./packs/graphweaver');
		execSync('npm i', { stdio: 'inherit' });

		process.chdir('../../packages/end-to-end');
		execSync('pwd', { stdio: 'inherit' });
		await removeDirectory('./app');

		// Create a new instance of the app
		execSync(
			'node ../../packs/graphweaver/bin init --name=app --backend=sqlite --useVersion="local"',
			{ stdio: 'inherit' }
		);

		// Create .env file
		const env = `DATABASE=sqlite`;
		await fs.promises.writeFile('.env.sqlite', env);

		// Install dependencies
		process.chdir('./app');
		execSync('pwd', { stdio: 'inherit' });
		await fs.promises.mkdir('node_modules');
		await copyDirectory('../../../packs/', './node_modules');
		execSync('npm i', { stdio: 'inherit' });

		// Copy the database
		await fs.promises.mkdir('databases');
		await copyFile('../databases/database.sqlite', 'databases/database.sqlite');

		// Import the database
		execSync('npm run import sqlite -- --database=databases/database.sqlite --o', {
			stdio: 'inherit',
		});
	} catch (error) {
		console.error('Error:', error);
	}
}

main();
