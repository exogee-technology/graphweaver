import { Entity, Field, ID, RelationshipField } from '@exogee/graphweaver';
import { MikroBackendProvider } from '@exogee/graphweaver-mikroorm';
import { Rootwithbackendid } from './rootwithbackendid';
import { Rootwithclientid } from './rootwithclientid';
import { Childwithclientid as OrmChildwithclientid } from '../entities';
import { connection } from '../database';

@Entity<Childwithclientid>('Childwithclientid', {
	provider: new MikroBackendProvider(OrmChildwithclientid, connection),
})
export class Childwithclientid {
	@Field(() => ID, { primaryKeyField: true })
	id!: string;

	@RelationshipField<Childwithclientid>(() => Rootwithclientid, { id: (entity) => entity.rootwithclientid?.id, nullable: true })
	rootwithclientid?: Rootwithclientid;

	@RelationshipField<Childwithclientid>(() => Rootwithbackendid, { id: (entity) => entity.rootwithbackendid?.id, nullable: true })
	rootwithbackendid?: Rootwithbackendid;

	@Field(() => String, { nullable: true })
	description?: string;
}
