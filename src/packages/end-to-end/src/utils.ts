import fs from 'fs';
import { config } from './config';

export const resetDatabase = () => {
	fs.copyFileSync(
		'./databases/database.sqlite',
		`./${config.appDirectory}/databases/database.sqlite`
	);
};
