import { BaseEntity, RelationshipType } from '../entities/base-entity';
import { EntityConstructor } from '../entity-manager';

interface FieldOptions {
	aliasName?: string;
	underlyingFieldName?: string;
	navigationPropertyName?: string;
	linkEntityAttributes?: {
		name?: string;
		from?: string;
		to?: string;
	};
}

export function ManyToOne<T extends BaseEntity, U>(
	relationship: () => U,
	options?: FieldOptions
): any {
	return function (target: EntityConstructor<T>, propertyKey: keyof BaseEntity) {
		console.log(`n-1 is this a relationship? ${relationship}`);
		if (relationship) {
			// REST uses the format *Id for underlying fields
			const underlyingFieldName = options?.underlyingFieldName ?? `${propertyKey}Id`;
			const navigationPropertyName = options?.navigationPropertyName ?? propertyKey;
			const linkEntityAttributes = options?.linkEntityAttributes ?? undefined;

			// Proxy any calls to @ManyToOne properties back to the underlying _entity object
			// so we don't need to copy data everywhere.
			Object.defineProperty(target, propertyKey, {
				get: function () {
					return this._entity[underlyingFieldName];
				},
				set: function (value: any) {
					this._entity[underlyingFieldName] = value;
				},
				enumerable: true,
			});

			// _relationshipMap are used to map the filter properties on a query and input data
			if (!target._relationshipMap) {
				target._relationshipMap = new Map();
			}
			target._relationshipMap.set(propertyKey, {
				type: RelationshipType.MANY_TO_ONE,
				entity: relationship,
				navigationPropertyName,
				linkEntityAttributes,
			});
		}

		if (options?.aliasName) {
			if (!target._aliasMap) {
				target._aliasMap = new Map<string, string>();
			}

			target._aliasMap.set(options.aliasName, propertyKey);
		}
	};
}
