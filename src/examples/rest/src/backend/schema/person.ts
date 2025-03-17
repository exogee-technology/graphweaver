import { AdminUIFilterType, Entity, Field, ID, RelationshipField } from '@exogee/graphweaver';
import { RestBackendProvider } from '@exogee/graphweaver-rest';

import { urlToIdTransform } from '../utils';
import { Vehicle } from './vehicle';

@Entity('Person', {
	adminUIOptions: { readonly: true },
	apiOptions: { excludeFromBuiltInWriteOperations: true },
	provider: new RestBackendProvider({
		baseUrl: 'https://swapi.info/api',
		defaultPath: 'people',
		fieldConfig: {
			url: { transform: urlToIdTransform },
			vehicles: { transform: urlToIdTransform },
		},
	}),
})
export class Person {
	@Field(() => ID, {
		primaryKeyField: true,
		adminUIOptions: { filterType: AdminUIFilterType.DROP_DOWN_TEXT },
	})
	url!: string;

	@Field(() => String)
	name!: string;

	@Field(() => String, { adminUIOptions: { filterType: AdminUIFilterType.DROP_DOWN_TEXT } })
	height!: string;

	@Field(() => String)
	mass!: string;

	@Field(() => String)
	hair_color!: string;

	@Field(() => String)
	birth_year!: string;

	@RelationshipField(() => [Vehicle], { id: 'vehicles', nullable: true })
	vehicles!: Vehicle[];
}
