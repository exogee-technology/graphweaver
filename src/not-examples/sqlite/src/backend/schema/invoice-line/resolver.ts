import { createBaseResolver, Resolver } from '@exogee/graphweaver';
import { MikroBackendProvider } from '@exogee/graphweaver-mikroorm';
import { InvoiceLine } from './entity';
import { InvoiceLine as OrmInvoiceLine } from '../../entities';
import { connection } from '../../database';

@Resolver((of) => InvoiceLine)
export class InvoiceLineResolver extends createBaseResolver<InvoiceLine, OrmInvoiceLine>(
	InvoiceLine,
	new MikroBackendProvider(OrmInvoiceLine, connection)
) {}
