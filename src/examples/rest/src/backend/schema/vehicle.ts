import { Entity, Field, ID, RelationshipField } from '@exogee/graphweaver';
import { Person } from './person';
import { Vehicle as RestVehicle } from '../entities';
import { AccessorParams, inMemoryFilterFor, RestBackendProvider } from '@exogee/graphweaver-rest';
import { fetch } from '../rest-client';

@Entity('Vehicle', {
	adminUIOptions: { readonly: true },
	apiOptions: { excludeFromBuiltInWriteOperations: true },
	provider: new RestBackendProvider('Person', {
		find: async ({ filter }: AccessorParams) => {
			const results = await fetch<RestVehicle>(`/vehicles`);

			for (const vehicle of results) {
				const [_, __, id] = (new URL(vehicle.url).pathname.split('/') || []).filter((part) => part);
				(vehicle as { id: string }).id = id || vehicle.url;
			}

			if (filter) return results.filter(inMemoryFilterFor(filter));

			return results;
		},
	}),
})
export class Vehicle {
	@Field(() => ID)
	id!: string;

	@Field(() => String)
	name!: string;

	@Field(() => String)
	model!: string;

	@Field(() => String)
	manufacturer!: string;

	@Field(() => String)
	costInCredits!: string;

	@Field(() => String)
	length!: string;

	@Field(() => String)
	crew!: string;

	@Field(() => String)
	passengers!: string;

	@RelationshipField(() => [Person], { id: 'pilots' })
	pilots!: string[];
}
