import { introspection } from '@exogee/graphweaver-mikroorm';
import { existsSync, mkdirSync, writeFileSync } from 'fs';
import ora from 'ora';
import path from 'path';
import { GRAPHWEAVER_TARGET_VERSION, MIKRO_ORM_TARGET_VERSION } from '../init/constants';

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
	const prompts = [];

	if (source === 'sqlite') {
		if (!database) {
			prompts.push({
				type: 'input',
				name: 'dbName',
				message: `What is the database name?`,
			});
		}
	}

	if (source === 'postgresql' || source === 'mysql') {
		if (!database) {
			prompts.push({
				type: 'input',
				name: 'dbName',
				message: `What is the database name?`,
			});
		}
		if (!host) {
			prompts.push({
				type: 'input',
				name: 'host',
				default: '127.0.0.1',
				message: `What is the database server's hostname?`,
			});
		}
		if (!port) {
			prompts.push({
				type: 'input',
				name: 'port',
				default: source === 'postgresql' ? 5432 : 3306,
				message: `What is the port?`,
			});
		}
		if (!password) {
			prompts.push({
				type: 'password',
				mask: '*',
				name: 'password',
				message: `What is the password for this user?`,
			});
		}
		if (!user) {
			prompts.push({
				type: 'input',
				name: 'user',
				message: `What is the username to access the database server?`,
			});
		}
	}
	const { default: inquirer } = await import('inquirer');

	if (prompts.length > 0) {
		const answers = await inquirer.prompt(prompts);
		database = answers.dbName ?? database;
		host = answers.host ?? host;
		port = answers.port ?? port;
		password = answers.password ?? password;
		user = answers.user ?? user;
	}

	// check we have all the dependencies needed to run the import
	checkForMissingDependencies(source);

	const spinner = ora('Introspecting...').start();

	try {
		const files = await introspection(source, {
			mikroOrmConfig: {
				host,
				dbName: database,
				user,
				password,
				port,
			},
		});

		spinner.stop();

		let fileCount = 0;
		for (const file of files) {
			createDirectories(path.join('./src/', file.path));

			const fileFullPath = path.join(process.cwd(), './src/', file.path, file.name);
			let overwrite = true;
			if (!overwriteAllFiles && file.needOverwriteWarning && existsSync(fileFullPath)) {
				const prompt = await inquirer.prompt<{ overwrite: boolean }>([
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
		if (isIntrospectionError(err)) {
			console.warn(`\n\n${err.title}\n${err.message}\n\n`);
		} else {
			throw err;
		}
	}

	// Force exit because Mikro is keeping the socket open to the db
	process.exit();
};
