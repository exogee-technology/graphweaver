import { Entity, Field, ID, RelationshipField } from '@exogee/graphweaver';
import { MikroBackendProvider } from '@exogee/graphweaver-mikroorm';
import { Invoice } from './invoice';
import { Track } from './track';
import { InvoiceLine as OrmInvoiceLine } from '../entities';
import { connection } from '../database';

@Entity('InvoiceLine', {
	provider: new MikroBackendProvider(OrmInvoiceLine, connection),
})
export class InvoiceLine {
	@Field(() => ID, { primaryKeyField: true })
	invoiceLineId!: number;

	@RelationshipField<InvoiceLine>(() => Invoice, {
		id: (entity) => entity.invoice?.invoiceId,
	})
	invoice!: Invoice;

	@RelationshipField<InvoiceLine>(() => Track, { id: (entity) => entity.track?.trackId })
	track!: Track;

	@Field(() => String)
	unitPrice!: string;

	@Field(() => Number)
	quantity!: number;
}
