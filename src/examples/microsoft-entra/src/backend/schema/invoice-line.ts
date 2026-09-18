import { Entity, ID } from '@exogee/graphweaver';
import { ApplyAccessControlList } from '@exogee/graphweaver-auth';

import { Invoice } from './invoice';
import { Track } from './track';
import { connection } from '../database';
import { Field, ManyToOne, SqlDataProvider } from '@exogee/graphweaver-sql';

@ApplyAccessControlList({
	Everyone: {
		read: true,
	},
})
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

	@Field(() => String, { column: 'UnitPrice' })
	unitPrice!: string;

	@Field(() => Number, { column: 'Quantity' })
	quantity!: number;
}
