import {
	AnyEntity,
	Collection,
	EntityData,
	EntityProperty,
	Reference,
	ReferenceType,
} from '@mikro-orm/core';
import { logger } from '@nscc-easy/logger';

import { Database } from '../database';

// This is how Mikro ORM does it within their own code, so in this file we're ok with non-null assertions.
/* eslint-disable @typescript-eslint/no-non-null-assertion */

interface AssignOptions {
	// Whether this assign should be allowed to create new entities.
	// If false and a create is attempted, assign will throw.
	// Defaults to true if not specified.
	create?: boolean;

	// Whether this assign should be allowed update existing entities.
	// If false and an update is attempted, assign will throw.
	// Defaults to true if not specified.
	update?: boolean;
}

export const assign = async <T extends AnyEntity<T>>(
	entity: T,
	data: EntityData<T>,
	options?: AssignOptions,
	visited = new Set<AnyEntity<any>>()
) => {
	if (visited.has(entity)) return entity;
	visited.add(entity);

	// We'll need the metadata for this entity to be able to traverse the properties later.
	const metadata = entity.__meta!;

	for (const [property, value] of Object.entries(data)) {
		const entityPropertyValue = (entity as any)[property];

		// We're going to need the metadata for this property so we can ensure it exists and so that we can
		// navigate to related entities.
		const propertyMetadata = (metadata.properties as any)[property] as
			| EntityProperty<T>
			| undefined;

		if (
			propertyMetadata?.reference === ReferenceType.MANY_TO_MANY ||
			propertyMetadata?.reference === ReferenceType.ONE_TO_MANY
		) {
			if (!Array.isArray(value))
				throw new Error(
					`Value is not an array while trying to assign to collection property ${property} on entity ${metadata.name}`
				);

			// Ensure the entity has a loaded collection at the same place.
			if (!(entityPropertyValue instanceof Collection)) {
				throw new Error(
					`Tried to merge array into non-collection property ${property} on entity ${metadata.name}`
				);
			}

			const visitedEntities = new Set<T>();

			for (const subvalue of value) {
				let entity: T | undefined;

				if (subvalue.id) {
					// Get the current entity from the ORM if there's an ID.
					entity = Database.em.getUnitOfWork().getById(propertyMetadata.type, subvalue.id);

					if (!entity) {
						// There are two cases here: either the user is trying to assign properties to the entity as well as changing members of a collection,
						// or they're just changing members of a collection.
						// For the former we actually need the entity from the DB, while for the latter we can let it slide and just pass an ID entity on down.
						if (Object.keys(subvalue).length === 1) {
							// It's just the ID.
							entity = Database.em.getReference(propertyMetadata.type, subvalue.id) as T;
						} else {
							logger.warn(
								`Doing a full database fetch for ${propertyMetadata.type} with id ${subvalue.id}, this should ideally be prefetched into the Unit of Work before calling assign() for performance`
							);

							// We should be prefetching for performance in most cases here but if we don't have it we can load it now.
							// From base resolver a reason this would be needed is when you're switching collection values from one entity to another, e.g.
							// Business unit 1 -> Business unit 2. In this scenario we prefetch the one that's currently on the entity, but the one we're changing
							// to is not in the unit of work.
							entity =
								((await Database.em.findOne(propertyMetadata.type, {
									id: subvalue.id,
								})) as T | null) ?? undefined;
						}
					}

					if (!entity) {
						throw new Error(
							`Attempted to assign as an update to '${propertyMetadata.name}' property of ${metadata.name} Entity, but even after a full fetch to the database ${propertyMetadata.type} with ID of ${subvalue.id} could not be found.`
						);
					}
				}

				const newEntity = await createOrAssignEntity<T>({
					entity,
					entityType: propertyMetadata.type,
					data: subvalue,
					options,
					visited,
				});

				// Ok, now we've got the created or updated entity, ensure it's in the collection
				// so its foreign keys are set correctly. If it's already in the collection this is a noop.
				entityPropertyValue.add(newEntity);

				// We need to keep track of the fact that this entity belongs here so it doesn't get removed in the cleanup step down below.
				visitedEntities.add(newEntity);
			}

			// Ok, at this point we know what IDs we visited. If anything is left in the collection that has an ID and has not been visited
			// it needs to be removed from the collection, because this is the canonical list of everything that's in the collection now.
			// ------------
			// ❗🐻 WARNING BEAR TRAP 🐻❗: If you're looking at this going, "But I just want to pass in the items I want to update and for it not to
			//          mess with the rest of the collection", this is here because without this behaviour, there's no way to remove items from
			//          Many to many properties. Consider the case of tags on an entity, when we pass ['a', 'b', 'c'] as the list of tags, that
			//          means we need to remove anything that isn't 'a', 'b', or 'c' because it's not in the array.
			entityPropertyValue.remove(
				...entityPropertyValue.getItems().filter((entity) => !visitedEntities.has(entity))
			);
		} else if (
			propertyMetadata?.reference == ReferenceType.MANY_TO_ONE ||
			propertyMetadata?.reference === ReferenceType.ONE_TO_ONE
		) {
			if (value === null) {
				// If the value is null, unset the reference
				(entity as any)[property] = null;
			} else {
				const valueKeys = Object.keys(value as any);
				if (valueKeys.length === 1 && valueKeys[0] === 'id') {
					// Ok, this is just the ID, set the reference and move on.
					(entity as any)[property] = Database.em.getReference(
						propertyMetadata.type,
						(value as any).id
					);
				} else {
					if (entityPropertyValue && !Reference.isReference(entityPropertyValue)) {
						throw new Error(
							`Trying to merge to related property ${property} on entity ${metadata.name} which is not a reference.`
						);
					}

					if (entityPropertyValue && !entityPropertyValue.isInitialized()) {
						throw new Error(
							`Trying to merge to related property ${property} on entity ${metadata.name} which is not initialised.`
						);
					}

					const newEntity = await createOrAssignEntity<T>({
						entity: entityPropertyValue?.unwrap() as T,
						entityType: propertyMetadata.type,
						data: value as EntityData<T>,
						options,
						visited,
					});

					(entity as any)[property] = Reference.create(newEntity);
				}
			}
		} else {
			// Ok, we're a simple scalar.
			(entity as any)[property] = value;
		}
	}

	return entity;
};

const createOrAssignEntity = <T extends AnyEntity<T>>({
	entity,
	entityType,
	data,
	options,
	visited,
}: {
	entity?: T;
	entityType: string;
	data: EntityData<T>;
	options?: AssignOptions;
	visited: Set<AnyEntity<any>>;
}) => {
	const create = options?.create ?? true;
	const update = options?.update ?? true;

	if ((data as any).id) {
		if (!update) {
			throw new Error(
				`Updates are disabled, but update value ${JSON.stringify(
					data
				)} was passed which has an ID property.`
			);
		}

		if (!entity) {
			throw new Error(
				`Tried to update with data ${JSON.stringify(
					data
				)} but entity could not be located to update.`
			);
		}

		// Ok, we need to recurse here.
		return assign(entity, data, options, visited);
	} else {
		if (!create) {
			throw new Error(
				`Creates are disabled, but update value ${JSON.stringify(
					data
				)} was passed which does not have an ID property.`
			);
		}

		// We don't want Mikro to manage the data merging here, we'll do it in the next line.
		const entity = Database.em.create<T>(entityType, {} as any);
		return assign(entity, data, options, visited);
	}
};
