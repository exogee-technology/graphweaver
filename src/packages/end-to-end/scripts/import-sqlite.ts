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
		process.chdir('../../');

		// Publish all local packages
		execSync('pnpm publish:local', { stdio: 'inherit' });

		// get list of all directories in the packs directory
		const packDirectories = await fs.promises.readdir('./packs/@exogee');

		// Update all packs package.json references to local files
		const packNames = [
			'graphweaver',
			'vite-plugin-graphweaver',
			...packDirectories.map((dir) => `@exogee/${dir}`),
		];

		// Update the local packages with references to one another
		for (const packName of packNames) {
			const packageJsonPath = path.join(`packs`, packName, `package.json`);
			const packageJson = JSON.parse(await fs.promises.readFile(packageJsonPath, 'utf-8'));

			// loop through the package dependencies and update the local references
			for (const key of Object.keys(packageJson.dependencies ?? {})) {
				if (packName.startsWith('@exogee') && key.startsWith('@exogee')) {
					packageJson.dependencies[key] = `file:../${key.replace('@exogee/', '')}`;
				} else if (key.startsWith('@exogee')) {
					packageJson.dependencies[key] = `file:../${key}`;
				} else if (packName.startsWith('@exogee') && key === 'vite-plugin-graphweaver') {
					packageJson.dependencies[key] = `file:../../vite-plugin-graphweaver`;
				}
			}

			await fs.promises.writeFile(packageJsonPath, JSON.stringify(packageJson, null, 2));
		}

		process.chdir('./packs/graphweaver');
		execSync('pnpm i --ignore-workspace --no-lockfile', { stdio: 'inherit' });

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
		execSync('pnpm i --ignore-workspace --no-lockfile', { stdio: 'inherit' });

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
