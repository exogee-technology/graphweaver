import { Field, ID, Entity } from '@exogee/graphweaver';
import { MediaField, GraphweaverMedia } from '@exogee/graphweaver-storage-provider';
import { pgConnection } from '../database';
import { ImageNote } from './image-note';
import { s3Provider } from '../s3-provider';
import { OneToMany, SqlDataProvider } from '@exogee/graphweaver-sql';

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

	// The inverse side of the one-to-one. The foreign key lives on `image_note`, so nothing is
	// stored on this table -- `@OneToMany` is the right marker even though the field is singular,
	// because what it describes is where the key lives, not how many rows come back. Core takes
	// the first row for a non-list field.
	@OneToMany(() => ImageNote, { relatedField: 'submission', nullable: true })
	imageNote?: ImageNote;
}
