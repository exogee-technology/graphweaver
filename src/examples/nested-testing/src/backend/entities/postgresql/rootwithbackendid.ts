import { Collection, Entity, OneToMany, PrimaryKey, Property } from '@mikro-orm/core';
import { Childwithbackendid } from './childwithbackendid';
import { Childwithclientid } from './childwithclientid';

@Entity({ tableName: 'rootwithbackendid' })
export class Rootwithbackendid {
	@PrimaryKey({ type: 'integer' })
	id!: number;

	@Property({ type: 'text', nullable: true })
	description?: string;

	@OneToMany({ entity: () => Childwithbackendid, mappedBy: 'rootwithbackendid' })
	childwithbackendids = new Collection<Childwithbackendid>(this);

	@OneToMany({ entity: () => Childwithclientid, mappedBy: 'rootwithbackendid' })
	childwithclientids = new Collection<Childwithclientid>(this);
}
