import { exit, cwd } from 'process';

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
	MikroOrmPostgres,
	MikroOrmMysql,
	REST,
	MikroOrmSqlite,
}

const abort = () => {
	console.log('Cancelled!');
	exit(1);
};

export const needsDatabaseConnection = (backends: Backend[]) =>
	backends.some((backend) =>
		[Backend.MikroOrmPostgres, Backend.MikroOrmMysql, Backend.MikroOrmSqlite].includes(backend)
	);

export const initGraphweaver = (projectName: string, backends: Backend[], version?: string) => {
	makeDirectories(projectName);
	makeReadme(projectName);
	makePackageJson(projectName, backends, version);
	makeTsConfig(projectName);
	makeIndex(projectName, backends);
	if (needsDatabaseConnection(backends)) makeDatabase(projectName, backends);
	makeSchemaIndex(projectName, backends);
};

type InitOptions = {
	version?: string /** Optional version to use for the starter */;
	name?: string /** Optional name to use for the project */;
	backend?: Backend /** Optional backend to use for the starter */;
};

export const init = async ({ version, name, backend }: InitOptions) => {
	console.log(`Graphweaver ${version ? 'using version ' + version : ''}\n`);

	if (backend && name) {
		initGraphweaver(name, [backend], version);
	} else {
		const { default: inquirer } = await import('inquirer');

		const {
			projectName,
			createDirectory = true,
			backends,
		} = await inquirer.prompt([
			{
				type: 'input',
				name: 'projectName',
				message: `What would your like to call your new project?`,
			},
			{
				type: 'checkbox',
				name: 'backends',
				message: 'Which Graphweaver backends will you need?',
				choices: [
					{
						value: Backend.MikroOrmPostgres,
						name: 'MikroORM - PostgreSQL Backend',
					},
					{
						value: Backend.MikroOrmMysql,
						name: 'MikroORM - MySQL Backend',
					},
					{
						value: Backend.MikroOrmSqlite,
						name: 'MikroORM - SQLite Backend',
					},
					{
						value: Backend.REST,
						name: 'REST Backend',
					},
				],
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
		initGraphweaver(projectName, backends, version);
	}

	console.log('All Done!\nMake sure you to pnpm install, then pnpm start.');

	exit(0);
};
