import { Entity, Field, ID, RelationshipField } from '@exogee/graphweaver';
import { ISODateStringScalar } from '@exogee/graphweaver-scalars';
import { MikroBackendProvider } from '@exogee/graphweaver-mikroorm';
import { ApplyAccessControlList } from '@exogee/graphweaver-auth';

import { Customer } from './customer';
import { InvoiceLine } from './invoice-line';
import { Invoice as OrmInvoice } from '../entities';
import { connection } from '../database';

@ApplyAccessControlList({
	Everyone: {
		read: true,
	},
})
@Entity('Invoice', {
	provider: new MikroBackendProvider(OrmInvoice, connection),
})
export class Invoice {
	@Field(() => ID, { primaryKeyField: true })
	invoiceId!: number;

	@RelationshipField<Invoice>(() => Customer, {
		id: (entity) => entity.customer?.customerId,
	})
	customer!: Customer;

	@Field(() => ISODateStringScalar)
	invoiceDate!: Date;

	@Field(() => String, { nullable: true })
	billingAddress?: string;

	@Field(() => String, { nullable: true })
	billingCity?: string;

	@Field(() => String, { nullable: true })
	billingState?: string;

	@Field(() => String, { nullable: true })
	billingCountry?: string;

	@Field(() => String, { nullable: true })
	billingPostalCode?: string;

	@Field(() => String)
	total!: string;

	@RelationshipField<InvoiceLine>(() => [InvoiceLine], { relatedField: 'invoice' })
	invoiceLines!: InvoiceLine[];
}
