import { Collection, Entity, OneToMany, PrimaryKey, Property } from '@mikro-orm/core';
import { Childwithbackendid } from './childwithbackendid';
import { Childwithclientid } from './childwithclientid';

@Entity({ tableName: 'rootwithclientid' })
export class Rootwithclientid {
	@PrimaryKey({ type: 'text' })
	id!: string;

	@Property({ type: 'text', nullable: true })
	description?: string;

	@OneToMany({ entity: () => Childwithbackendid, mappedBy: 'rootwithclientid' })
	childwithbackendids = new Collection<Childwithbackendid>(this);

	@OneToMany({ entity: () => Childwithclientid, mappedBy: 'rootwithclientid' })
	childwithclientids = new Collection<Childwithclientid>(this);
}
