import { graphweaverMetadata } from '@exogee/graphweaver';

export enum Roles {
	LIGHT_SIDE = 'LIGHT_SIDE',
	DARK_SIDE = 'DARK_SIDE',
}

graphweaverMetadata.collectEnumInformation({
	name: 'Roles',
	target: Roles,
});
