import { createBaseResolver, Resolver } from '@exogee/graphweaver';
import { MikroBackendProvider } from '@exogee/graphweaver-mikroorm';
import { Customer } from './entity';
import { Customer as OrmCustomer } from '../../entities';
import { connection } from '../../database';

@Resolver((of) => Customer)
export class CustomerResolver extends createBaseResolver<Customer, OrmCustomer>(
	Customer,
	new MikroBackendProvider(OrmCustomer, connection)
) {}
