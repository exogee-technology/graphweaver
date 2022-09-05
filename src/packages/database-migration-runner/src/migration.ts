import { Client } from 'pg';

export interface Migration {
	sortKey: number;
	up: (database: Client) => Promise<any>;
}
