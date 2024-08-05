import { Entity, Field, ID, RelationshipField } from '@exogee/graphweaver';
import { MikroBackendProvider } from '@exogee/graphweaver-mikroorm';
import { myConnection } from '../database';
import { TaskCountByTag as OrmTaskCountByTag } from '../entities';
import { Tag } from './tag';
import {
	AccessControlList,
	ApplyAccessControlList,
	AuthorizationContext,
} from '@exogee/graphweaver-auth';

const acl: AccessControlList<TaskCountByTag, AuthorizationContext> = {
	// Dark side users can look at all tasks, nobody else can.
	DARK_SIDE: { all: true },
};

// Note: This entity is backed by a view. It allows filtering, pagination, and sorting as per normal
//       but it is not writeable, hence the apiOptions below.
@ApplyAccessControlList(acl)
@Entity('TaskCountByTag', {
	provider: new MikroBackendProvider(OrmTaskCountByTag, myConnection),
	apiOptions: { excludeFromBuiltInWriteOperations: true },
})
export class TaskCountByTag {
	@Field(() => ID, { primaryKeyField: true })
	tagId!: string;

	@RelationshipField<TaskCountByTag>(() => Tag, { id: (row) => row.tagId })
	tag!: Tag;

	@Field(() => Number)
	count!: number;
}
