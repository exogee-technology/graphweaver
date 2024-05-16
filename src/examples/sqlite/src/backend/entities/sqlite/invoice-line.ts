import { Entity, ManyToOne, PrimaryKey, Property, Ref } from '@mikro-orm/core';
import { BaseEntity } from '@exogee/graphweaver-mikroorm';
import { Invoice } from './invoice';
import { Track } from './track';

@Entity({ tableName: 'InvoiceLine' })
export class InvoiceLine extends BaseEntity {
	@PrimaryKey({ fieldName: 'InvoiceLineId', type: 'number' })
	id!: number;

	@ManyToOne({
		entity: () => Invoice,
		ref: true,
		fieldName: 'InvoiceId',
		index: 'IFK_InvoiceLineInvoiceId',
	})
	invoice!: Ref<Invoice>;

	@ManyToOne({
		entity: () => Track,
		ref: true,
		fieldName: 'TrackId',
		index: 'IFK_InvoiceLineTrackId',
	})
	track!: Ref<Track>;

	@Property({ fieldName: 'UnitPrice', type: 'NUMERIC(10,2)' })
	// Mikro-orm serializes this as a string for precision, but it's a number in the database
	unitPrice!: string;

	@Property({ fieldName: 'Quantity', type: 'number' })
	quantity!: number;
}
