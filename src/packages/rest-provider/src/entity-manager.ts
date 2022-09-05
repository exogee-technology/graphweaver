import {
	BaseEntity,
	RelationshipMap,
	RelationshipType,
	Relationship,
} from './entities';

export interface EntityConstructor<T extends BaseEntity> {
	new (_entity: any): T;
	entityPath?: string;
	entityName: string;
	typeName?: string;
	_fieldMap: Map<string, string>;
	_aliasMap?: Map<string, string>;
	_relationshipMap?: RelationshipMap<any>;
	_externalEntityMap?: Map<string, string>;
}

export enum Aggregate {
	COUNT = 'count',
}

declare type SelectOptions<T> = Array<keyof T>;

declare type QueryOptions<T> = {
	select: SelectOptions<T>;
	filter: Record<string, any>;
	limit: number;
	offset: number;
	count: boolean;
	orderBy: string;
	aggregate?: Aggregate;
};

interface EntityManagerOptions {
	overrideSelect?: any;
}

interface SearchOptions {
	search: string;
	entities: Array<EntityConstructor<BaseEntity>>;
	filter?: string;
	maxRetries?: number;
	top?: number; // max number of results to return from dynamics maxes out at 100
	limit?: number; // max number of results to return by combining requests no maximum
}

const privateProperties = new Set([
	'_fieldMap',
	'_relationshipMap',
	'_externalEntityMap',
	'_aliasMap',
	'_withFormattedValuesFor',
]);

type ObjectWithId = {
	id: string;
};

const hasId = (obj: unknown): obj is ObjectWithId => {
	return (obj as ObjectWithId).id !== undefined && typeof (obj as ObjectWithId).id === 'string';
};

const isObject = (value: unknown) => {
	const type = typeof value;
	return value != null && (type === 'object' || type === 'function');
};

export class EntityManager<T extends BaseEntity> {
	constructor(private _entity: EntityConstructor<T>, private options: EntityManagerOptions = {}) {}

	private assertEntityProperties(condition: unknown): asserts condition {
		if (condition) {
			return;
		}
		throw new Error(`Uninitialised 'resource' property in ${this._entity.name}`);
	}

	private getAllPublicPropertiesForEntity = () => {
		return (Object.keys(this._entity.prototype) as Array<keyof T>).filter(
			(key) => !privateProperties.has(key as string)
		);
	};

	private defaultSelectForEntity = () =>
		this.options?.overrideSelect ?? this.getAllPublicPropertiesForEntity();

	private mapRelationship(
		value: { [prop: string]: any },
		key: string,
		subValue: unknown,
		relationship: Relationship<EntityConstructor<T>>,
		mapAsInput?: boolean // We need to map differently when we are creating or updating relationships
	) {
		// We only allow the update of many-to-one relationships, if we are updating we map differently
		if (
			RelationshipType.MANY_TO_ONE &&
			mapAsInput &&
			hasId(subValue) &&
			relationship.navigationPropertyName
		) {
			const relatedEntity = relationship.entity();
			// Linking entities in the CRM happens with the navigation property name and odata bind
			const dataBindKey = `${relationship.navigationPropertyName}@odata.bind`;
			value[dataBindKey] = `/${relatedEntity.entityPath}(${subValue.id})`;
			// We also delete the original key name as we need the bind key for linking entities
			delete value[key];
		} else {
			// We are querying for data and here we need to map any relationships to the linkEntity used by FetchXML
			const relationshipKey = relationship?.linkEntityAttributes?.name ?? key;
			// We allow here the overriding of any __attrs on the linkEntity
			// This can be useful when making requests to the CRM outside of GraphQL
			const existingAttribute = (subValue as any)?.__attrs;
			// We don't want to pass the existing attributes to the filter so let's remove it
			if (existingAttribute) delete (subValue as any)?.__attrs;
			value[relationshipKey] = {
				__attrs: {
					...(relationship.linkEntityAttributes ?? {}),
					...(existingAttribute ?? {}),
				},
				__value: this.mapValueWithEntity(relationship.entity(), subValue),
			};

			// We delete the original key name as this does not exist on the entity in the CRM
			if (
				relationship?.linkEntityAttributes?.name &&
				relationship.linkEntityAttributes.name !== key
			) {
				delete value[key];
			}
		}
	}

	private mapValueWithEntity = (
		entity: EntityConstructor<T>,
		value: any | any[],
		mapAsInput?: boolean // passed through to mapRelationshipWithEntity
	): any => {
		const { _fieldMap, _relationshipMap, _aliasMap, _externalEntityMap } = entity.prototype;

		if (typeof value === 'string') {
			if (_fieldMap.has(value)) return _fieldMap.get(value);
		} else if (Array.isArray(value)) {
			return value.map((element: Record<string, any> | string) =>
				this.mapValueWithEntity(entity, element)
			);
		} else if (value instanceof Date) {
			// If we have a date then we should convert to an ISO string
			return value.toISOString();
		} else if (isObject(value)) {
			// Visit all the things.
			for (const [key, subValue] of Object.entries(value)) {
				// Let's check if there is a relationship on this key
				const alias = _aliasMap?.get(key);
				const relationship = _relationshipMap?.get(alias ?? key);
				// If the relationship exists and the subValue is an object then we need to map it
				// We only care about literal objects so here we ignore Array
				// @todo what happens here if the array is an array of relationships?
				if (relationship && subValue instanceof Object && !Array.isArray(subValue)) {
					this.mapRelationship(value, key, subValue, relationship, mapAsInput);
				} else if (_externalEntityMap?.has(key) && isObject(subValue) && hasId(subValue)) {
					// If we have an external entity then we need to flatten the object and map it
					// For example: { contact: { id: '123' } } to { contactid: '123' }
					const externalIdField = _externalEntityMap?.get(key);
					value[externalIdField] = subValue.id;
					delete value[key];
				} else {
					// if the key is not a relationship or external ID then we can just continue mapping the fields
					value[key] = this.mapValueWithEntity(entity, subValue);

					// Finally, we need to change any keys to the underlyingFieldName in the CRM which is created in both the field and many-to-many decorators
					const mapField = _fieldMap.get(key);
					if (typeof mapField !== 'undefined') {
						value[mapField] = value[key];
						delete value[key];
					}
				}
			}
			return value;
		}
		return value;
	};

	public mapFieldsAndRelationshipsForEntity = ({
		value,
		mapAsInput = false,
	}: {
		value: any;
		mapAsInput?: boolean;
	}) => (!value ? value : this.mapValueWithEntity(this._entity, value, mapAsInput));

	private queryHasFieldsWithFormattedValues = (value: any) =>
		value?.select?.filter((property: unknown) =>
			this._entity.prototype._withFormattedValuesFor?.has(property)
		).length > 0 ?? false;

	public readonly list = async (query?: Partial<QueryOptions<T>>) => {
		const { entityPath, entityName } = this._entity;
		this.assertEntityProperties(entityPath !== undefined && entityName !== undefined);

		query = query || {};
		if (!query.select) query.select = this.defaultSelectForEntity();
		query = this.mapFieldsAndRelationshipsForEntity({ value: query });

	};

	public readonly aggregate = async (type: Aggregate, query?: Partial<QueryOptions<T>>) => {
		const { entityPath, entityName } = this._entity;
		this.assertEntityProperties(entityPath !== undefined && entityName !== undefined);

		query = query || {};
		if (!query.select) query.select = ['id' as keyof T];
		query.aggregate = type;
		query = this.mapFieldsAndRelationshipsForEntity({ value: query });

		// const [aggregateResponse] = result.value;
		// return aggregateResponse[type as keyof typeof aggregateResponse];
	};

	public readonly getOne = async (query?: Partial<QueryOptions<T>>) => {
		const { entityPath, entityName } = this._entity;
		this.assertEntityProperties(entityPath !== undefined && entityName !== undefined);

		// We only need one, so filter to this.
		query = query || {};
		if (!query.select) query.select = this.defaultSelectForEntity();
		query.limit = 1;
		query = this.mapFieldsAndRelationshipsForEntity({ value: query });

		return null;
	};

	public readonly createOne = async (entity: Partial<T>, expand?: (keyof T)[]) => {
		const { entityPath, entityName } = this._entity;
		this.assertEntityProperties(entityName !== undefined && entityPath !== undefined);

		return new this._entity(undefined);
	};

	public readonly updateOne = async (id: string, values: Partial<T>) => {
		const { entityPath, entityName } = this._entity;
		this.assertEntityProperties(entityName !== undefined && entityPath !== undefined);

		return new this._entity(undefined);
	};

}
