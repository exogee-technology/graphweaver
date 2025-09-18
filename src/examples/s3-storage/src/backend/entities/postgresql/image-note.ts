import { Entity, OneToOne, PrimaryKey, Property } from '@mikro-orm/core';
import type { Ref } from '@mikro-orm/core';
import { Submission } from './submission';

@Entity()
export class ImageNote {
	@PrimaryKey({ type: 'uuid' })
	id!: string;

	@OneToOne({
		entity: () => Submission,
	})
	submission!: Ref<Submission>;

	@Property({ type: 'text' })
	note!: string;
}
