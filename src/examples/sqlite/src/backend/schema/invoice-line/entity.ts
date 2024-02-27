import { Field, GraphQLEntity, ID, ObjectType, RelationshipField } from '@exogee/graphweaver';
import { Invoice } from '../invoice';
import { Track } from '../track';
import { InvoiceLine as OrmInvoiceLine } from '../../entities';

@ObjectType('InvoiceLine')
export class InvoiceLine extends GraphQLEntity<OrmInvoiceLine> {
	public dataEntity!: OrmInvoiceLine;

	@Field(() => ID)
	id!: number;

	@RelationshipField<InvoiceLine>(() => Invoice, { id: (entity) => entity.invoice?.id })
	invoice!: Invoice;

	@RelationshipField<InvoiceLine>(() => Track, { id: (entity) => entity.track?.id })
	track!: Track;

	@Field(() => String)
	unitPrice!: string;

	@Field(() => Number)
	quantity!: number;
}
