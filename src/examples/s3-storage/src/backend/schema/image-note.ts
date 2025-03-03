import { Entity, Field, ID, RelationshipField } from '@exogee/graphweaver';
import { ImageNote as OrmImageNote } from '../entities';
import { Submission } from './submission';
import { MikroBackendProvider } from '@exogee/graphweaver-mikroorm';
import { pgConnection } from '../database';

@Entity('ImageNote', {
	provider: new MikroBackendProvider(OrmImageNote, pgConnection),
	apiOptions: { clientGeneratedPrimaryKeys: true },
})
export class ImageNote {
	@Field(() => ID)
	id!: string;

	@RelationshipField<ImageNote>(() => Submission, {
		id: (entity) => entity.submission.id,
	})
	submission!: Submission;

	@Field(() => String)
	note!: string;
}
