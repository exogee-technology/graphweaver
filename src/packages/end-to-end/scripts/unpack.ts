import * as fs from 'fs';
import * as path from 'path';
import { exec } from 'promisify-child-process';

async function removeDirectory(directoryPath: string) {
	if (fs.existsSync(directoryPath)) {
		await fs.promises.rm(directoryPath, { recursive: true });
	}
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
		await removeDirectory(`local_modules`);
		process.chdir('../../');

		// Publish all local packages
		await execAsync('pnpm pack:all');

		// Copy the .packs directory to a new local_modules directory
		await fs.promises.cp('.packs', './packages/end-to-end/local_modules', { recursive: true });
		process.chdir('./packages/end-to-end');

		// Extract all the tarballs and rename the directories
		const tarballs = await fs.promises.readdir('local_modules');
		await fs.promises.mkdir('local_modules/@exogee', { recursive: true });
		for (const tarball of tarballs) {
			await execAsync(`tar -xzf local_modules/${tarball} -C local_modules`);
			const packageName = JSON.parse(
				await fs.promises.readFile(`local_modules/package/package.json`, 'utf-8')
			).name;
			await fs.promises.rm(`local_modules/${tarball}`);
			// Rename the directory to the package name
			await fs.promises.rename(`local_modules/package`, `local_modules/${packageName}`);
		}

		// get list of all directories in the packs directory
		const packDirectories = await fs.promises.readdir('./local_modules/@exogee');

		// Update all packs package.json references to local files
		const packNames = [
			'graphweaver',
			'vite-plugin-graphweaver',
			...packDirectories.map((dir) => `@exogee/${dir}`),
		];

		// Update the local packages with references to one another
		for (const packName of packNames) {
			const packageJsonPath = path.join(`local_modules`, packName, `package.json`);
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

		process.chdir('./local_modules/graphweaver');
		await execAsync('pnpm i --ignore-workspace --no-lockfile');
	} catch (error) {
		console.error(error);
	}
}

main();
