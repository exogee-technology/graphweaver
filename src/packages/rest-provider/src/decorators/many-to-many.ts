import { BaseEntity, RelationshipType } from '../entities/base-entity';
import { EntityConstructor } from '../entity-manager';

interface FieldOptions {
	aliasName?: string;
	underlyingFieldName?: string;
	linkEntityAttributes?: {
		name?: string;
		from?: string;
		to?: string;
	};
}

export function ManyToMany<T extends BaseEntity, U>(
	relationship: () => U,
	options: FieldOptions
): any {
	return function (target: EntityConstructor<T>, propertyKey: keyof BaseEntity) {
		if (relationship) {
			// _relationshipMap are used to map the filter properties on a query
			if (!target._relationshipMap) {
				target._relationshipMap = new Map();
			}
			target._relationshipMap.set(propertyKey, {
				type: RelationshipType.MANY_TO_MANY,
				entity: relationship,
				...options,
			});
		}

		if (options?.underlyingFieldName) {
			// If they specify the same underlying field name as the property we get some very weird behaviour. This is never needed,
			// so just error in this case.
			if (options.underlyingFieldName === propertyKey) {
				throw new Error(
					`Entity '${target.constructor.name}' has set '${options.underlyingFieldName}' as the underlyingFieldName for '${propertyKey}'. Please remove the underlyingFieldName configuration as this is extraneous and leads to undefined behaviour.`
				);
			}

			if (!target._fieldMap) {
				target._fieldMap = new Map<string, string>();
			}

			target._fieldMap.set(propertyKey, options.underlyingFieldName);
		}

		if (options?.aliasName) {
			if (!target._aliasMap) {
				target._aliasMap = new Map<string, string>();
			}

			target._aliasMap.set(propertyKey, options.aliasName);
		}
	};
}
