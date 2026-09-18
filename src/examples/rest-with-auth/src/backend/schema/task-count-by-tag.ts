import { Entity, Field, ID } from '@exogee/graphweaver';
import { myConnection } from '../database';
import { Tag } from './tag';
import {
	AccessControlList,
	ApplyAccessControlList,
	AuthorizationContext,
} from '@exogee/graphweaver-auth';
import { SqlDataProvider, ManyToOne } from '@exogee/graphweaver-sql';

const acl: AccessControlList<TaskCountByTag, AuthorizationContext> = {
	// Dark side users can look at all tasks, nobody else can.
	DARK_SIDE: { read: true },
};

// Note: This entity is backed by a view. It allows filtering, pagination, and sorting as per normal
//       but it is not writeable, hence the apiOptions below.
@ApplyAccessControlList(acl)
@Entity('TaskCountByTag', {
	provider: new SqlDataProvider(() => TaskCountByTag, myConnection),
	apiOptions: { excludeFromBuiltInWriteOperations: true },
})
export class TaskCountByTag {
	@Field(() => ID, { primaryKeyField: true })
	tagId!: string;

	@ManyToOne(() => Tag, { column: 'tag_id' })
	tag!: Tag;

	@Field(() => Number)
	count!: number;
}
