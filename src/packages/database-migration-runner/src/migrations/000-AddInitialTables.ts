import { Client } from 'pg';

import { Migration } from '../migration';

export class AddInitialTables implements Migration {
	sortKey = 0;

	public async up(database: Client): Promise<any> {

		// Apollo Sessions
		await database.query(
			`create table "session" ("session_token" varchar(255) not null, "expires_at" timestamptz(0) not null, "value" jsonb null);`
		);

		// Audit-related entries
		await database.query(
			`create table "audit_change" ("id" bigserial primary key, "type" text check ("type" in ('create', 'update', 'delete')) not null, "entity_id" varchar(255) not null, "entity_type" varchar(255) not null, "created_by" varchar(255) not null, "created_at" timestamptz(0) not null, "data" jsonb null);`
		);
		await database.query(
			`create table "audit_related_entity_change" ("id" bigserial primary key, "change_id" bigint not null, "related_entity_type" varchar(255) not null, "related_entity_id" varchar(255) not null);`
		);
		await database.query(
			`alter table "audit_related_entity_change" add constraint "audit_related_entity_change_change_id_foreign" foreign key ("change_id") references "audit_change" ("id") on update cascade on delete cascade;`
		);
		await database.query(
			`create index "audit_change_entity_type_entity_id_index" on "audit_change" ("entity_type", "entity_id");`
		);
		await database.query(
			`create index "audit_related_entity_change_related_entity_type_related_entity_id_index" on "audit_related_entity_change" ("related_entity_type", "related_entity_id");`
		);

		// Entities
		await database.query(
			`create table "user" ("id" bigserial primary key, "name" text not null);`
		)
	}
}
