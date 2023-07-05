import { introspection } from '@exogee/graphweaver-mikroorm';
import { existsSync, mkdirSync, writeFileSync } from 'fs';
import ora from 'ora';
import path from 'path';

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

export const importDataSource = async (source: 'mysql' | 'postgresql') => {
	const { default: inquirer } = await import('inquirer');
	const { host, dbName, user, password, port } = await inquirer.prompt([
		{
			type: 'input',
			name: 'host',
			default: '127.0.0.1',
			message: `What is the database server's hostname?`,
		},
		{
			type: 'input',
			name: 'dbName',
			message: `What is the database name?`,
		},
		{
			type: 'input',
			name: 'user',
			message: `What is the username to access the database server?`,
		},
		{
			type: 'input',
			name: 'password',
			message: `What is the password for this user?`,
		},
		{
			type: 'input',
			name: 'port',
			default: source === 'postgresql' ? 5432 : 3306,
			message: `What is the port?`,
		},
	]);

	const spinner = ora('Introspecting...').start();

	const files = await introspection(source, {
		mikroOrmConfig: {
			host,
			dbName,
			user,
			password,
			port,
		},
	});

	spinner.stop();
	console.log('Import complete.');

	for (const file of files) {
		createDirectories(path.join('./src/', file.path));
		writeFileSync(path.join(process.cwd(), './src/', file.path, file.name), file.contents);
	}

	// Force exit because Mikro is keeping the socket open to the db
	process.exit();
};
