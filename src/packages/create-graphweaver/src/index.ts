import { exit, cwd } from 'node:process';
import chalk from 'chalk';
import inquirer from 'inquirer';

import {
	makePackageJson,
	makeDirectories,
	makeIndex,
	makeSchemaIndex,
	makeTsConfig,
} from './template';

import { Backend } from './backend';

// const thisScriptDirectory = __dirname;

(async () => {
	console.log(chalk.green('GraphWeaver\n'));

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
					value: Backend.MikroORM,
					name: 'MikroORM Backend (MySQL, PostgreSQL, SQLite)',
				},
				{
					value: Backend.REST,
					name: 'RESTful Backend (REST APIs)',
				},
			],
		},

		{
			type: 'confirm',
			name: 'createDirectory',
			message: `OK, we're ready- I'm going to create a new app in ${cwd()}- is that OK?`,
		},
	]);

	if (!createDirectory) abort();

	makeDirectories();
	makePackageJson(projectName, backends);
	makeTsConfig();
	makeIndex(projectName, backends);
	makeSchemaIndex(projectName, backends);

	console.log(
		chalk.green(
			'All Done!\nMake sure you npm install / yarn install / pnpm install, then pnpm start to get started'
		)
	);

	exit(0);
})();

const abort = () => {
	console.log('Cancelled!');
	exit(1);
};
