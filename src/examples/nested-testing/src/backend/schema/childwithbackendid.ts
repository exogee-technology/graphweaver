import { Entity, Field, ID, RelationshipField } from '@exogee/graphweaver';
import { MikroBackendProvider } from '@exogee/graphweaver-mikroorm';
import { Rootwithbackendid } from './rootwithbackendid';
import { Rootwithclientid } from './rootwithclientid';
import { Childwithbackendid as OrmChildwithbackendid } from '../entities';
import { connection } from '../database';

@Entity<Childwithbackendid>('Childwithbackendid', {
	provider: new MikroBackendProvider(OrmChildwithbackendid, connection),
})
export class Childwithbackendid {
	@Field(() => ID, { primaryKeyField: true })
	id!: number;

	@RelationshipField<Childwithbackendid>(() => Rootwithclientid, { id: (entity) => entity.rootwithclientid?.id, nullable: true })
	rootwithclientid?: Rootwithclientid;

	@RelationshipField<Childwithbackendid>(() => Rootwithbackendid, { id: (entity) => entity.rootwithbackendid?.id, nullable: true })
	rootwithbackendid?: Rootwithbackendid;

	@Field(() => String, { nullable: true })
	description?: string;
}
