import { Entity, PrimaryKey, Property } from '@mikro-orm/core';

@Entity()
export class Migration {
	@PrimaryKey({ type: 'number' })
	id!: number;

	@Property({ type: 'number' })
	lastMigration!: number;

	@Property({ type: 'date' })
	runAt!: Date;
}
