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

		// Copy the rest example over for testing
		await execAsync('cp -r ../../examples/rest ./app');

		// Update to use the local dependencies
		process.chdir('./app');
		const packageJsonPath = path.join(`package.json`);
		const packageJson = JSON.parse(await fs.promises.readFile(packageJsonPath, 'utf-8'));

		for (const key of Object.keys(packageJson.dependencies ?? {})) {
			if (key.startsWith('@exogee')) {
				packageJson.dependencies[key] = `file:../local_modules/${key}`;
			} else if (key === 'graphweaver') {
				packageJson.dependencies[key] = `file:../local_modules/graphweaver`;
			} else if (key === 'vite-plugin-graphweaver') {
				packageJson.dependencies[key] = `file:../local_modules/vite-plugin-graphweaver`;
			} else if (key === 'mikro-orm-sqlite-wasm') {
				packageJson.dependencies[key] = `file:../local_modules/mikro-orm-sqlite-wasm`;
			}
		}

		await fs.promises.writeFile(packageJsonPath, JSON.stringify(packageJson, null, 2));

		await execAsync('pwd');
		await execAsync('pnpm i --ignore-workspace --no-lockfile');

		const tsJson = JSON.parse(await fs.promises.readFile('tsconfig.json', 'utf-8'));
		delete tsJson.references;
		await fs.promises.writeFile('tsconfig.json', JSON.stringify(tsJson, null, 2));

		// Import the database
		await execAsync('pnpm build');
		await execAsync('pnpm import-database');
	} catch (error) {
		console.error('Error:', error);
		throw error;
	}
}

main();
