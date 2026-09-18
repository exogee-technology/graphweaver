import { Entity, ID } from '@exogee/graphweaver';
import { ApplyAccessControlList } from '@exogee/graphweaver-auth';

import { Track } from './track';
import { connection } from '../database';
import { Field, OneToMany, SqlDataProvider } from '@exogee/graphweaver-sql';

@ApplyAccessControlList({
	Everyone: {
		read: true,
	},
})
@Entity('MediaType', {
	provider: new SqlDataProvider(() => MediaType, connection, { table: 'MediaType' }),
})
export class MediaType {
	@Field(() => ID, { column: 'MediaTypeId', primaryKeyField: true })
	mediaTypeId!: number;

	@Field(() => String, { column: 'Name', nullable: true, adminUIOptions: { summaryField: true } })
	name?: string;

	@OneToMany(() => [Track], { relatedField: 'mediaType' })
	tracks!: Track[];
}
