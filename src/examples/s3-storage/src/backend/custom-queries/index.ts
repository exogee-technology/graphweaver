import { fromBackendEntity, graphweaverMetadata, ResolverOptions } from '@exogee/graphweaver';
import { sql } from '@exogee/graphweaver-sql';
import { pgConnection } from '../database';
import { Submission, submissionProvider } from '../schema/submission';

graphweaverMetadata.addQuery({
	name: 'submissionByFilename',
	getType: () => Submission,
	args: { filename: () => String },
	resolver: async ({ args }: ResolverOptions<{ filename: string }>) => {
		// `image` is a JSON column, and reaching inside one is beyond what the filter grammar can
		// say -- so this is exactly what the raw query escape hatch is for. The interpolation is a
		// bound parameter, not string concatenation.
		const [row] = await pgConnection.raw<{ id: string }>(
			sql`SELECT id FROM submission WHERE image->>'filename' = ${args.filename} LIMIT 1`
		);

		if (!row) return null;

		// Raw rows are exactly what the driver returned, so go back through the provider to get a
		// properly hydrated entity.
		const result = await submissionProvider.findOne({ id: String(row.id) });

		return result ? fromBackendEntity(Submission, result) : null;
	},
});
