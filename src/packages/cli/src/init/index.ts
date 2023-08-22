import { exit, cwd } from 'process';
import validate from 'validate-npm-package-name';
import { valid as validSemver } from 'semver';

import {
	makePackageJson,
	makeDirectories,
	makeIndex,
	makeSchemaIndex,
	makeTsConfig,
	makeReadme,
	makeDatabase,
} from './template';

export enum Backend {
	Postgres = 'Postgres',
	Mysql = 'Mysql',
	Rest = 'Rest',
	Sqlite = 'Sqlite',
}

const abort = () => {
	console.log('Cancelled!');
	exit(1);
};

export const needsDatabaseConnection = (backends: Backend[]) =>
	backends.some((backend) => [Backend.Postgres, Backend.Mysql, Backend.Sqlite].includes(backend));

export const initGraphweaver = (projectName: string, backends: Backend[], version?: string) => {
	makeDirectories(projectName);
	makeReadme(projectName);
	makePackageJson(projectName, backends, version);
	makeTsConfig(projectName);
	makeIndex(projectName);
	if (needsDatabaseConnection(backends)) makeDatabase(projectName, backends);
	makeSchemaIndex(projectName);
};

type InitOptions = {
	version?: string /** Optional version to use for the starter */;
	name?: string /** Optional name to use for the project */;
	backends?: Array<Backend> /** Optional backend to use for the starter */;
};

export const init = async ({
	version,
	name: initialName,
	backends: initialBackends,
}: InitOptions) => {
	if (version !== undefined && !validSemver(version) && version !== 'local')
		throw new Error(`'${version}' is not a valid semver`);

	if (initialName && Array.isArray(initialBackends) && initialBackends.length > 0) {
		initGraphweaver(initialName, initialBackends, version);
	} else {
		const { default: inquirer } = await import('inquirer');

		const {
			name,
			createDirectory = true,
			backends,
		} = await inquirer.prompt([
			{
				type: 'input',
				name: 'name',
				message: `What would your like to call your new project?`,
				default: initialName,
				validate: (answer) => {
					const { validForNewPackages, warnings } = validate(answer);
					if (!validForNewPackages)
						return `Project name is not valid: ${warnings?.join(',') ?? ''}`;
					return true;
				},
			},
			{
				type: 'checkbox',
				name: 'backends',
				message: 'Which Graphweaver backends will you need?',
				default: initialBackends,
				choices: [
					{
						value: Backend.Postgres,
						name: 'MikroORM - PostgreSQL Backend',
					},
					{
						value: Backend.Mysql,
						name: 'MikroORM - MySQL Backend',
					},
					{
						value: Backend.Sqlite,
						name: 'MikroORM - SQLite Backend',
					},
					{
						value: Backend.Rest,
						name: 'REST Backend',
					},
				],
				validate: (answer) => {
					if (answer.length < 1) {
						return 'You must select at least one backend (Press <space> to select).';
					}

					return true;
				},
			},
			{
				type: 'confirm',
				name: 'createDirectory',
				message: (answers) =>
					`OK, we're ready- I'm going to create a new app in "${cwd()}/${
						answers.projectName
					}" - is that OK?`,
			},
		]);

		if (!createDirectory) abort();
		initGraphweaver(name, backends, version);
	}

	console.log(
		'All Done!\nMake sure you cd to the new project directory, then run pnpm install and pnpm start.'
	);

	exit(0);
};
