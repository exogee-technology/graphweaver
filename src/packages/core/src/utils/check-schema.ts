import { getMetadataStorage } from 'type-graphql';

export type CheckSchemaForCollisionsOptions = {
	operations: string[];
	mode: 'queries' | 'mutations';
};

export const checkSchemaForCollisions = ({ operations, mode }: CheckSchemaForCollisionsOptions) => {
	const metadata = getMetadataStorage();
	const currentOperations = new Set(metadata[mode].map((query) => query.schemaName));
	const duplicateOperations = operations.filter((operation) => currentOperations.has(operation));

	if (duplicateOperations.length > 0) {
		throw new Error(
			`Graphweaver Startup Error: Failed to generate base resolver ${mode} (${duplicateOperations.join(
				', '
			)}). Check your custom ${mode} for any name collisions or duplicate plural name usage.`
		);
	}
};
