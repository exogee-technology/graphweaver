import { BaseEntity } from '../entities/base-entity';
import { Serializer } from '../serializers';

interface BaseEntityClass {
	new: () => BaseEntity;
	_fieldMap?: Map<string, string>;
	_withFormattedValuesFor?: Set<string>;
}

interface FieldOptions {
	underlyingFieldName?: string;
	useFormattedValue?: boolean;
	serializer?: Serializer;
}

export function Field(options?: FieldOptions): any {
	return function (target: BaseEntityClass, propertyKey: keyof BaseEntity) {
		// Proxy any calls to @Field properties back to the underlying _entity object
		// so we don't need to copy data everywhere.
		Object.defineProperty(target, propertyKey, {
			get: function () {
				const key = options?.underlyingFieldName || propertyKey;
				const value = this._entity[
					options?.useFormattedValue ? `${key}@OData.Community.Display.V1.FormattedValue` : key
				];
				if (options?.serializer) {
					return options.serializer.fromCrm(value);
				}

				return value;
			},
			set: function (value: any) {
				let valueToSet = value;

				if (options?.serializer) {
					valueToSet = options.serializer.toCrm(value);
				}

				this._entity[options?.underlyingFieldName || propertyKey] = valueToSet;
			},
			enumerable: true,
		});

		// Store the set of fields that use formatted values, so that we only add the
		// FormattedValues metadata header to our CRM request if we need to
		if (options?.useFormattedValue) {
			if (!target._withFormattedValuesFor) target._withFormattedValuesFor = new Set<string>();
			target._withFormattedValuesFor?.add(propertyKey);
		}

		// Remember this for later so we can correctly translate from our names
		// to the underlying names for selects and filters.
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
	};
}
