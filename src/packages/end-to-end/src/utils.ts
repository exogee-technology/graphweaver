import fs from 'fs';
import { config } from './config';

export const resetDatabase = () => {
	fs.copyFileSync('./database.sqlite', `./${config.appDirectory}/database.sqlite`);
};
