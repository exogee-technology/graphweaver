import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import {
	DatabaseSsl,
	Source,
	dialectForSource,
	startIntrospection,
} from '@exogee/graphweaver-builder';
import ora from 'ora-classic';

import { DRIVER_VERSIONS, driverPackageForSource } from '../init/backend';
import { GRAPHWEAVER_TARGET_VERSION } from '../init/constants';
import { promptForDatabaseOptions } from '../database';

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

const checkForMissingDependencies = (source: Source) => {
	// We want to read the package.json of gw app so we can ignore this error
	// eslint-disable-next-line @typescript-eslint/no-require-imports
	const packageJson = require(path.join(process.cwd(), 'package.json'));
	const dependencies = Object.keys(packageJson.dependencies ?? {});

	// These dependencies are required to run the introspection. One package for the provider, one
	// for the dialect, and the driver itself -- which is a peer of the dialect package so that
	// users pin their own driver version.
	const requiredDependencies = [
		'@exogee/graphweaver-sql',
		`@exogee/graphweaver-sql-${dialectForSource(source)}`,
		driverPackageForSource(source),
	];

	// hold on to any missing deps
	const missingDependencies: string[] = [];

	requiredDependencies.forEach((dependency) => {
		if (!dependencies.includes(dependency)) {
			// we found a missing dep lets save it
			const version = dependency.startsWith('@exogee/')
				? GRAPHWEAVER_TARGET_VERSION
				: DRIVER_VERSIONS[dependency];
			missingDependencies.push(`${dependency}@${version}`);
		}
	});

	if (missingDependencies.length > 0) {
		console.warn(`\n\nPlease install these missing dependencies and try again:\n`);
		console.warn(`\t\t pnpm i ${missingDependencies.join(' ')}\n\n`);
		process.exit(1);
	}
};

interface ImportDataSourceOptions {
	source: Source;
	dbName?: string;
	host?: string;
	port?: number;
	password?: string;
	user?: string;
	ssl?: DatabaseSsl;
	overwriteAllFiles?: boolean;
	clientGeneratedPrimaryKeys?: boolean;
}

export const importDataSource = async ({
	source,
	dbName,
	host,
	port,
	password,
	user,
	ssl,
	overwriteAllFiles,
	clientGeneratedPrimaryKeys,
}: ImportDataSourceOptions) => {
	const databaseOptions = await promptForDatabaseOptions({
		source,
		dbName,
		host,
		port,
		password,
		user,
		ssl,
	});
	const apiOptions = {
		clientGeneratedPrimaryKeys: clientGeneratedPrimaryKeys ?? false,
	};
	// check we have all the dependencies needed to run the import
	checkForMissingDependencies(source);

	const spinner = ora('Introspecting...').start();

	try {
		const files = await startIntrospection(databaseOptions, apiOptions);
		spinner.stop();

		let fileCount = 0;
		for (const file of files) {
			const fileFullPath = path.join(process.cwd(), 'src', file.path);
			// `recursive` rather than walking the segments ourselves: rebuilding an absolute path
			// by joining its parts onto '' drops the leading separator, so every import left an
			// empty copy of the output tree hanging off the working directory.
			mkdirSync(path.dirname(fileFullPath), { recursive: true });

			let overwrite = true;
			if (!overwriteAllFiles && file.warnBeforeOverwrite && existsSync(fileFullPath)) {
				const { default: inquirer } = await import('inquirer');
				const prompt = await inquirer.prompt<{ overwrite: boolean }>([
					{
						type: 'confirm',
						name: 'overwrite',
						message: `Overwrite this file ${file.path}?`,
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
