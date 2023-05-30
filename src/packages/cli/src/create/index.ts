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

import { Backend } from './backend';

const abort = () => {
	console.log('Cancelled!');
	exit(1);
};

export const needsDatabaseConnection = (backends: Backend[]) =>
	backends.some((backend) => [Backend.MikroOrmPostgres, Backend.MikroOrmMysql].includes(backend));

export const createGraphWeaver = (projectName: string, backends: Backend[]) => {
	makeDirectories(projectName);
	makeReadme(projectName);
	makePackageJson(projectName, backends);
	makeTsConfig(projectName);
	makeIndex(projectName, backends);
	if (needsDatabaseConnection(backends)) makeDatabase(projectName, backends);
	makeSchemaIndex(projectName, backends);
};

export const create = async () => {
	console.log('GraphWeaver\n');

	import('inquirer').then(async ({ default: inquirer }) => {
		const { projectName, createDirectory, backends } = await inquirer.prompt([
			{
				type: 'input',
				name: 'projectName',
				message: `What would your like to call your new project?`,
			},
			{
				type: 'checkbox',
				name: 'backends',
				message: 'Which GraphWeaver backends will you need?',
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

		createGraphWeaver(projectName, backends);

		console.log('All Done!\nMake sure you to pnpm install, then pnpm start.');

		exit(0);
	});
};
