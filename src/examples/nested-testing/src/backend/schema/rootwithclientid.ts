import { Entity, Field, ID, RelationshipField } from '@exogee/graphweaver';
import { MikroBackendProvider } from '@exogee/graphweaver-mikroorm';
import { Childwithbackendid } from './childwithbackendid';
import { Childwithclientid } from './childwithclientid';
import { Rootwithclientid as OrmRootwithclientid } from '../entities';
import { connection } from '../database';

@Entity<Rootwithclientid>('Rootwithclientid', {
	provider: new MikroBackendProvider(OrmRootwithclientid, connection),
})
export class Rootwithclientid {
	@Field(() => ID, { primaryKeyField: true })
	id!: string;

	@Field(() => String, { nullable: true })
	description?: string;

	@RelationshipField<Childwithbackendid>(() => [Childwithbackendid], { relatedField: 'rootwithclientid' })
	childwithbackendids!: Childwithbackendid[];

	@RelationshipField<Childwithclientid>(() => [Childwithclientid], { relatedField: 'rootwithclientid' })
	childwithclientids!: Childwithclientid[];
}
