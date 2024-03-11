import { createBaseResolver, Resolver } from '@exogee/graphweaver';
import { MikroBackendProvider } from '@exogee/graphweaver-mikroorm';
import { Invoice } from './entity';
import { Invoice as OrmInvoice } from '../../entities';
import { connection } from '../../database';

@Resolver((of) => Invoice)
export class InvoiceResolver extends createBaseResolver<Invoice, OrmInvoice>(
	Invoice,
	new MikroBackendProvider(OrmInvoice, connection)
) {}
