import fs from 'fs';
import path from 'path';

import { getDbSchema } from '..';

const schemaFilePath = path.resolve('./src/utils/generated-files/initialise-db.sql');

// Make folder if it doesn't exist.
if (!fs.existsSync(path.dirname(schemaFilePath))) {
	fs.mkdirSync(path.dirname(schemaFilePath));
}

getDbSchema().then((schema) => {
	fs.writeFileSync(schemaFilePath, schema);
	process.exit(0);
});
