import { exit, cwd } from 'process';
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

const abort = () => {
	console.log('Cancelled!');
	exit(1);
};

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
					value: Backend.MikroORMPostgres,
					name: 'MikroORM - PostgreSQL Backend',
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
