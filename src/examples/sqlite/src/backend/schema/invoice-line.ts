import { Entity, ID } from '@exogee/graphweaver';
import { Invoice } from './invoice';
import { Track } from './track';
import { connection } from '../database';
import { Field, ManyToOne, SqlDataProvider } from '@exogee/graphweaver-sql';

@Entity('InvoiceLine', {
	provider: new SqlDataProvider(() => InvoiceLine, connection, { table: 'InvoiceLine' }),
})
export class InvoiceLine {
	@Field(() => ID, { column: 'InvoiceLineId', primaryKeyField: true })
	invoiceLineId!: number;

	@ManyToOne(() => Invoice, { column: 'InvoiceId' })
	invoice!: Invoice;

	@ManyToOne(() => Track, { column: 'TrackId' })
	track!: Track;

	@Field(() => String, {
		column: 'UnitPrice',
		adminUIOptions: {
			format: { type: 'currency', variant: 'AUD' },
		},
	})
	unitPrice!: string;

	@Field(() => Number, { column: 'Quantity' })
	quantity!: number;
}
