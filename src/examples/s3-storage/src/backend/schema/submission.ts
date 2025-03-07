import { Field, ID, Entity, RelationshipField } from '@exogee/graphweaver';
import { MediaField, GraphweaverMedia } from '@exogee/graphweaver-storage-provider';
import { MikroBackendProvider } from '@exogee/graphweaver-mikroorm';

import { pgConnection } from '../database';
import { ImageNote } from './image-note';
import { Submission as OrmSubmission } from '../entities';
import { s3Provider } from '../s3-provider';

if (!process.env.AWS_S3_BUCKET) throw new Error('Missing required env AWS_S3_BUCKET');

@Entity('Submission', {
	provider: new MikroBackendProvider(OrmSubmission, pgConnection),
})
export class Submission {
	@Field(() => ID)
	id!: string;

	@MediaField({ storageProvider: s3Provider })
	image?: GraphweaverMedia;

	@RelationshipField<Submission>(() => ImageNote, {
		id: (entity) => {
			if (!entity.imageNote) return null;
			return entity.imageNote.id;
		},
		nullable: true,
	})
	imageNote?: ImageNote;
}
