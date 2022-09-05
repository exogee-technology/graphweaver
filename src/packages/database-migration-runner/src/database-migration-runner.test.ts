import { Client } from 'pg';

import { connectToDatabase } from './utils';

test('connect to database', async () => {
	const database = await connectToDatabase();
	expect(database).toBeInstanceOf(Client);
	await database.end();
});
