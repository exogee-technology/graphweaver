import { introspection } from '../src';

const go = async () => {
	await introspection('postgresql', {
		mikroOrmConfig: {
			host: 'localhost',
			port: 5432,
			dbName: 'introspection_test',
		},
	});
};

go();
