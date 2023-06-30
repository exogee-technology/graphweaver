import { introspection } from '@exogee/graphweaver-mikroorm';
import { existsSync, mkdirSync, writeFileSync } from 'fs';
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

export const importDataSource = async () => {
	console.log('importDataSource...');
	const files = await introspection('postgresql', {
		mikroOrmConfig: {
			host: '127.0.0.1',
			user: 'postgres',
			password: '',
			dbName: 'go-collect',
			port: 5432,
		},
	});
	console.log('Import complete.');

	for (const file of files) {
		createDirectories(path.join('./src/dist/', file.path));
		writeFileSync(path.join(process.cwd(), './src/dist/', file.path, file.name), file.contents);
	}

	// Force exit because Mikro is keeping the socket open to the db
	process.exit();
};
