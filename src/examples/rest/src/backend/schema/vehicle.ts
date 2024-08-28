import { Entity, Field, ID, RelationshipField } from '@exogee/graphweaver';
import { Person } from './person';
import { RestBackendProvider } from '@exogee/graphweaver-rest';
import { urlToIdTransform } from '../utils';

@Entity('Vehicle', {
	adminUIOptions: { readonly: true },
	apiOptions: { excludeFromBuiltInWriteOperations: true },
	provider: new RestBackendProvider({
		baseUrl: 'https://swapi.info/api',
		defaultPath: 'vehicles',
		fieldConfig: {
			url: { transform: urlToIdTransform },
			pilots: { transform: urlToIdTransform },
		},
	}),
})
export class Vehicle {
	@Field(() => ID, { primaryKeyField: true })
	url!: string;

	@Field(() => String)
	name!: string;

	@Field(() => String)
	model!: string;

	@Field(() => String)
	manufacturer!: string;

	@Field(() => String)
	cost_in_credits!: string;

	@Field(() => String)
	length!: string;

	@Field(() => String)
	crew!: string;

	@Field(() => String)
	passengers!: string;

	@RelationshipField(() => [Person], { id: 'pilots' })
	pilots!: string[];
}
