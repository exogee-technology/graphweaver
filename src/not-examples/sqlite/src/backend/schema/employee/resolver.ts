import { createBaseResolver, Resolver } from '@exogee/graphweaver';
import { MikroBackendProvider } from '@exogee/graphweaver-mikroorm';
import { Employee } from './entity';
import { Employee as OrmEmployee } from '../../entities';
import { connection } from '../../database';

@Resolver((of) => Employee)
export class EmployeeResolver extends createBaseResolver<Employee, OrmEmployee>(
	Employee,
	new MikroBackendProvider(OrmEmployee, connection)
) {}
