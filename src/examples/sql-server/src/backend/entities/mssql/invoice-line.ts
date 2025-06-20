import { Entity, ManyToOne, PrimaryKey, Property, Ref } from '@mikro-orm/core';
import { Invoice } from './invoice';
import { Track } from './track';

@Entity({ tableName: 'InvoiceLine' })
export class InvoiceLine {
	@PrimaryKey({ fieldName: 'InvoiceLineId', type: 'integer' })
	invoiceLineId!: number;

	@ManyToOne({ entity: () => Invoice, ref: true, fieldName: 'InvoiceId', index: 'IFK_InvoiceLineInvoiceId' })
	invoice!: Ref<Invoice>;

	@ManyToOne({ entity: () => Track, ref: true, fieldName: 'TrackId', index: 'IFK_InvoiceLineTrackId' })
	track!: Ref<Track>;

	@Property({ fieldName: 'UnitPrice', type: 'decimal' })
	unitPrice!: string;

	@Property({ fieldName: 'Quantity', type: 'integer' })
	quantity!: number;
}
