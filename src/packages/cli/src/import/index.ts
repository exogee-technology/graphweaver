import { introspection } from '@exogee/graphweaver-mikroorm';

export const importDataSource = async () => {
	console.log('importDataSource...');
	await introspection('postgresql', {
		mikroOrmConfig: {
			host: '127.0.0.1',
			user: 'postgres',
			password: '',
			dbName: 'go-collect',
		},
	});
	console.log('Import complete.');

	// Force exit because Mikro is keeping the socket open to the db
	process.exit();
};
