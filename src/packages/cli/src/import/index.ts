import { startIntrospection } from '@exogee/graphweaver-builder';
import { existsSync, mkdirSync, writeFileSync } from 'fs';
import ora from 'ora-classic';
import path from 'path';

import { GRAPHWEAVER_TARGET_VERSION, MIKRO_ORM_TARGET_VERSION } from '../init/constants';
import { promptForDatabaseOptions } from '../database';

const createDirectories = (dirPath: string) => {
	const directories = dirPath.split(path.sep);
	let currentPath = '';

	for (const directory of directories) {
		currentPath = path.join(currentPath, directory);
		if (!existsSync(currentPath)) {
			mkdirSync(currentPath);
		}
	}
};

export const isIntrospectionError = (
	error: any
): error is { type: string; title: string; message: string } => {
	return (
		typeof error.type === 'string' &&
		typeof error.title === 'string' &&
		error.type === 'IntrospectionError' &&
		typeof error.message === 'string'
	);
};

const checkForMissingDependencies = (source: 'mysql' | 'postgresql' | 'sqlite') => {
	// We want to read the package.json of gw app so we can ignore this error
	// eslint-disable-next-line @typescript-eslint/no-var-requires
	const packageJson = require(path.join(process.cwd(), 'package.json'));
	const dependencies = Object.keys(packageJson.dependencies ?? {});

	// These dependencies are required to run the
	const requiredDependencies = [
		'@exogee/graphweaver-mikroorm',
		'@mikro-orm/core',
		`@mikro-orm/${source}`,
	];

	// hold on to any missing deps
	const missingDependencies: string[] = [];

	requiredDependencies.forEach((dependency) => {
		if (!dependencies.includes(dependency)) {
			// we found a missing dep lets save it
			const version = dependency.includes('@mikro-orm/')
				? MIKRO_ORM_TARGET_VERSION
				: GRAPHWEAVER_TARGET_VERSION;
			missingDependencies.push(`${dependency}@${version}`);
		}
	});

	if (missingDependencies.length > 0) {
		console.warn(`\n\nPlease install these missing dependencies and try again:\n`);
		console.warn(`\t\t pnpm i ${missingDependencies.join(' ')}\n\n`);
		process.exit(1);
	}
};

export const importDataSource = async (
	source: 'mysql' | 'postgresql' | 'sqlite',
	database?: string,
	host?: string,
	port?: number,
	password?: string,
	user?: string,
	overwriteAllFiles?: boolean
) => {
	const databaseOptions = await promptForDatabaseOptions({
		source,
		database,
		host,
		port,
		password,
		user,
	});

	// check we have all the dependencies needed to run the import
	await checkForMissingDependencies(source);

	const spinner = ora('Introspecting...').start();

	try {
		const files = await startIntrospection(databaseOptions);
		spinner.stop();

		let fileCount = 0;
		for (const file of files) {
			createDirectories(path.join('./src/', file.path));

			const fileFullPath = path.join(process.cwd(), './src/', file.path, file.name);
			let overwrite = true;
			if (!overwriteAllFiles && file.needOverwriteWarning && existsSync(fileFullPath)) {
				const { default: inquirer } = await import('inquirer');
				const prompt = await inquirer.prompt<any, { overwrite: boolean }>([
					{
						type: 'confirm',
						name: 'overwrite',
						message: `Overwrite this file ${path.join(file.path, file.name)}?`,
						default: true,
					},
				]);
				overwrite = prompt.overwrite;
			}
			if (overwrite) {
				writeFileSync(fileFullPath, file.contents);
				fileCount += 1;
			}
		}
		console.log(`${fileCount} files have been successfully created in the project.`);
	} catch (err: unknown) {
		console.error(err);
		if (isIntrospectionError(err)) {
			console.warn(`\n\n${err.title}\n${err.message}\n\n`);
		} else {
			throw err;
		}
	}

	// Force exit because Mikro is keeping the socket open to the db
	process.exit();
};
