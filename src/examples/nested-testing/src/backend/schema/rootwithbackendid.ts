import { Entity, Field, ID, RelationshipField } from '@exogee/graphweaver';
import { MikroBackendProvider } from '@exogee/graphweaver-mikroorm';
import { Childwithbackendid } from './childwithbackendid';
import { Childwithclientid } from './childwithclientid';
import { Rootwithbackendid as OrmRootwithbackendid } from '../entities';
import { connection } from '../database';

@Entity<Rootwithbackendid>('Rootwithbackendid', {
	provider: new MikroBackendProvider(OrmRootwithbackendid, connection),
})
export class Rootwithbackendid {
	@Field(() => ID, { primaryKeyField: true })
	id!: number;

	@Field(() => String, { nullable: true })
	description?: string;

	@RelationshipField<Childwithbackendid>(() => [Childwithbackendid], { relatedField: 'rootwithbackendid' })
	childwithbackendids!: Childwithbackendid[];

	@RelationshipField<Childwithclientid>(() => [Childwithclientid], { relatedField: 'rootwithbackendid' })
	childwithclientids!: Childwithclientid[];
}
