import { BigIntType, Entity, OneToOne, PrimaryKey, Property } from '@mikro-orm/core';
import { ImageNote } from './image-note';

@Entity()
export class Submission {
	@PrimaryKey({ type: new BigIntType('string') })
	id!: string;

	@Property({ type: 'jsonb', nullable: true })
	image?: { filename: string; type: string };

	@OneToOne({ entity: () => ImageNote, mappedBy: 'submission', nullable: true })
	imageNote?: ImageNote;
}
