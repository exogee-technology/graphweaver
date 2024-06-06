import { graphweaverMetadata } from '..';

const excludeGraphweaverTypes = [
	'AdminUiEntityAttributeMetadata',
	'AdminUiFilterMetadata',
	'AdminUiFieldAttributeMetadata',
	'AdminUiFieldExtensionsMetadata',
	'AdminUiFieldMetadata',
	'AdminUiEntityMetadata',
	'AdminUiEnumValueMetadata',
	'AdminUiEnumMetadata',
	'AdminUiMetadata',
	'_service',
];

export const getEntityTargets = function* () {
	for (const entity of graphweaverMetadata.entities()) {
		if (!excludeGraphweaverTypes.includes(entity.name)) yield entity;
	}
};
