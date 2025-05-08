import { Entity, ManyToOne, PrimaryKey, Property, Ref } from '@mikro-orm/core';
import { Rootwithbackendid } from './rootwithbackendid';
import { Rootwithclientid } from './rootwithclientid';

@Entity({ tableName: 'childwithbackendid' })
export class Childwithbackendid {
	@PrimaryKey({ type: 'integer' })
	id!: number;

	@ManyToOne({ entity: () => Rootwithclientid, ref: true, fieldName: 'root_with_client_id_id', nullable: true })
	rootwithclientid?: Ref<Rootwithclientid>;

	@ManyToOne({ entity: () => Rootwithbackendid, ref: true, fieldName: 'root_with_backend_id_id', nullable: true })
	rootwithbackendid?: Ref<Rootwithbackendid>;

	@Property({ type: 'text', nullable: true })
	description?: string;
}
