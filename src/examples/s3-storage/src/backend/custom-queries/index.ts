import { fromBackendEntity, graphweaverMetadata, ResolverOptions } from '@exogee/graphweaver';
import { ConnectionManager } from '@exogee/graphweaver-mikroorm';
import { pgConnection } from '../database';
import { Submission as OrmSubmission } from '../entities';
import { Submission } from '../schema';

graphweaverMetadata.addQuery({
	name: 'submissionByFilename',
	getType: () => Submission,
	args: { filename: () => String },
	resolver: async ({ args }: ResolverOptions<{ filename: string }>) => {
		const db = ConnectionManager.database(pgConnection.connectionManagerId);
		const result = await db.em.findOne(OrmSubmission, { image: { filename: args.filename } });

		return result ? fromBackendEntity(Submission, result) : null;
	},
});
