import { Field, ID, Entity } from '@exogee/graphweaver';
import { MediaField, GraphweaverMedia } from '@exogee/graphweaver-storage-provider';
import { pgConnection } from '../database';
import { ImageNote } from './image-note';
import { s3Provider } from '../s3-provider';
import { ManyToOne, SqlDataProvider } from '@exogee/graphweaver-sql';

if (!process.env.AWS_S3_BUCKET) throw new Error('Missing required env AWS_S3_BUCKET');

export const submissionProvider = new SqlDataProvider(() => Submission, pgConnection);

@Entity('Submission', {
	provider: submissionProvider,
})
export class Submission {
	@Field(() => ID)
	id!: string;

	@MediaField({ storageProvider: s3Provider })
	image?: GraphweaverMedia;

	// The SQL provider has no dedicated one-to-one. At the column level the owning side of a
	// one-to-one is just a foreign key, so it is modelled as a many-to-one; the only thing lost is
	// the uniqueness guarantee, which belongs to the database anyway.
	@ManyToOne(() => ImageNote, { column: 'image_note_id', nullable: true })
	imageNote?: ImageNote;
}
