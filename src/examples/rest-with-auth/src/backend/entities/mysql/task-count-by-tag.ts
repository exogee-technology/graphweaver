import { BigIntType, Entity, ManyToOne, Property, Ref } from '@mikro-orm/core';
import { Tag } from './tag';

// You can use these kinds of virtual entities (https://mikro-orm.io/docs/virtual-entities)
// to either code specific queries you want to get results from as is being done here, or also
// select from views.
@Entity({
	expression: `
        SELECT tag_id, COUNT(task_id) AS count
        FROM task_tags
        GROUP BY tag_id`,
})
export class TaskCountByTag {
	@Property({ fieldName: 'tag_id', type: new BigIntType('string') })
	tagId!: string;

	@Property({ type: () => Number })
	count!: number;

	@ManyToOne({ entity: () => Tag, ref: true, fieldName: 'tag_id' })
	tag?: Ref<Tag>;
}
