import { Entity, Field, ID } from '@exogee/graphweaver';
import { Submission } from './submission';
import { pgConnection } from '../database';
import { ManyToOne, SqlDataProvider } from '@exogee/graphweaver-sql';

@Entity('ImageNote', {
	provider: new SqlDataProvider(() => ImageNote, pgConnection),
	apiOptions: { clientGeneratedPrimaryKeys: true },
})
export class ImageNote {
	@Field(() => ID)
	id!: string;

	// This is the owning side: `image_note.submission_id` is the real foreign key. A one-to-one's
	// owning side is a foreign key like any other, so it is a many-to-one here; the only thing
	// lost is the uniqueness guarantee, which belongs to the database.
	@ManyToOne(() => Submission, { column: 'submission_id' })
	submission!: Submission;

	@Field(() => String)
	note!: string;
}
