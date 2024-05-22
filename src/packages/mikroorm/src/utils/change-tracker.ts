import {
	AnyEntity,
	ChangeSet,
	ChangeSetType,
	EventSubscriber,
	FlushEventArgs,
	Reference,
} from '@mikro-orm/core';

import { AuditChange, AuditRelatedEntityChange } from '../entities';
import { AuthenticationContext } from './authentication-context';
import { TrackedEntity } from './tracked-entity';
import { isUntrackedProperty } from './untracked-property';

export class ChangeTracker implements EventSubscriber {
	async afterFlush({ uow, em }: FlushEventArgs): Promise<void> {
		const changesets = uow
			.getChangeSets()
			.filter((cs) => cs.entity instanceof TrackedEntity) as unknown as ChangeSet<
			TrackedEntity<any>
		>[];
		const trx = em.getTransactionContext();

		for (const cs of changesets) {
			let change;

			const data = dataForChangeSet(cs);
			if (data || cs.type === ChangeSetType.DELETE) {
				const changeData = {
					type: cs.type,
					entityId: cs.entity.id,
					entityType: cs.name,
					createdAt: new Date(),
					createdBy: AuthenticationContext.currentUser,
					data,
				};
				change = await em.getDriver().nativeInsert(AuditChange.name, changeData, trx);
			}

			const entity = cs.entity;
			const relatedEntities = entity.relatedTrackedEntities;
			if (relatedEntities) {
				for (const re of relatedEntities) {
					const relatedEntityData = {
						change: change?.insertId,
						relatedEntityId: re.id,
						relatedEntityType: re.entityType,
					};
					await em.getDriver().nativeInsert(AuditRelatedEntityChange.name, relatedEntityData, trx);
				}
			}
		}
	}
}

const dataForChangeSet = <T extends TrackedEntity<T>>(cs: ChangeSet<TrackedEntity<T>>) => {
	if (cs.payload && cs.type !== ChangeSetType.DELETE) {
		const entries = Object.entries(cs.payload)
			.filter(([k]) => !isUntrackedProperty(cs.entity, k))
			.map(([k]) => processPayloadEntry(k, cs));
		const id = cs.type === ChangeSetType.CREATE ? { to: cs.entity.id } : undefined;
		if (entries.length || id) return { ...Object.fromEntries(entries), id };
	}

	return undefined;
};

const processPayloadEntry = (
	key: string,
	{ meta, originalEntity, entity: updatedEntity, type }: ChangeSet<TrackedEntity<any>>
) => {
	let from = originalEntity ? originalEntity[key as keyof typeof originalEntity] : null;
	if (!from && type === ChangeSetType.CREATE) from = undefined;
	let to = updatedEntity[key as keyof typeof updatedEntity] ?? null;

	if (meta.primaryKeys.length !== 1) throw new Error('Composite primary keys are not supported');
	const [primaryKey] = meta.primaryKeys;

	if (Reference.isReference(to)) {
		const relatedToEntity = to as Reference<AnyEntity>;
		relatedToEntity.getEntity();
		if (from) {
			const id = Reference.isReference(from)
				? (from as Reference<AnyEntity>).getProperty(primaryKey)
				: from;
			from = {
				reference: {
					type: relatedToEntity.constructor.name,
					id,
				},
			} as any;
		}
		to = {
			reference: {
				type: relatedToEntity.constructor.name,
				id: relatedToEntity.unwrap()[primaryKey],
			},
		} as any;
	}
	return [key, { from, to }];
};
