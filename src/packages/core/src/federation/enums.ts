import { graphweaverMetadata } from '../metadata';

export enum LinkPurpose {
	SECURITY = 'SECURITY',
	EXECUTION = 'EXECUTION',
}

export const addEnums = () => {
	graphweaverMetadata.collectEnumInformation({
		name: 'link__Purpose',
		target: LinkPurpose,
	});
};
