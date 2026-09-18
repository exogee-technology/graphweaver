import { Entity, Field, ID, RelationshipField } from '@exogee/graphweaver';
import { Submission } from './submission';
import { pgConnection } from '../database';
import { SqlDataProvider } from '@exogee/graphweaver-sql';

@Entity('ImageNote', {
	provider: new SqlDataProvider(() => ImageNote, pgConnection),
	apiOptions: { clientGeneratedPrimaryKeys: true },
})
export class ImageNote {
	@Field(() => ID)
	id!: string;

	/** TODO(graphweaver): could not migrate this automatically -- @OneToOne has no equivalent in the SQL provider. */
	@RelationshipField<ImageNote>(() => Submission, {
		id: (entity) => entity.submission.id,
	})
	submission!: Submission;

	@Field(() => String)
	note!: string;
}
