import { MikroORM } from '@mikro-orm/core';

export const generateMikroDataEntity = async () => {

export const introspection = async () => {
	console.log('introspecting...');
	const orm = await MikroORM.init({
		discovery: {
			// we need to disable validation for no entities
			warnWhenNoEntities: false,
		},
		type: 'postgresql',
		dbName: 'todo_app',
		user: 'postgres',
		password: '',
		port: 5432,
	});
	const generator = orm.getEntityGenerator();
	const dump = await generator.generate({
		baseDir: process.cwd() + '/backend/entities',
	});
	console.log(dump);
	await orm.close(true);
};

//1. Generate Mikro Data Entities
//2. Convert to GW Data Entities
//3. Transcribe GW GraphQL entity from GW Data Entity
