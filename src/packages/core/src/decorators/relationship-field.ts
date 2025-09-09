import { GetTypeFunction } from '../types';
import { graphweaverMetadata } from '../metadata';

type RelationshipFieldOptions<D> = {
	relatedField?: keyof D & string;
	id?: (keyof D & (string | bigint)) | ((dataEntity: D) => string | number | bigint | undefined);
	nullable?: boolean;
	adminUIOptions?: {
		hideInTable?: boolean;
		hideInFilterBar?: boolean;
		hideInDetailForm?: boolean;
		readonly?: boolean;

		// 'load' is the default. When this is set the table will load and render the
		// related items. In the detail panel a combo box is presented where users can
		// edit the linked items via the relationship.
		//
		// 'count' is for relationships that are too large to load and render in this way.
		// It will display a single count value, for example "10,000 tracks". When clicked
		// the user will be redirected to the table filtered to the related items. This will
		// not allow them to edit the relationship on the detail panel, but often they're able
		// to edit on the other side of the relationship, for example a genre has many tracks,
		// but each track only has a few genres, so we can leave the default 'load' behaviour on
		// the track side of the relationship, but switch it to 'count' on the genre side.
		relationshipBehaviour?: 'load' | 'count';

		// Use this to filter the valid options that users can select from the Admin UI.
		// This does not validate the values sent to the API, just adds a filter to the
		// component when it's displayed in the Admin UI only. Handy for quality of life
		// improvements that aren't security concerns.
		filterOptions?: Record<string, unknown>;
	};

	// Add custom field directives to this field
	directives?: Record<string, any>;
};

export function RelationshipField<RelatedType = unknown>(
	returnTypeFunc: GetTypeFunction,
	{ relatedField, id, nullable = false, ...remainingOptions }: RelationshipFieldOptions<RelatedType>
) {
	return (target: unknown, key: string) => {
		if (!id && !relatedField)
			throw new Error(
				`Implementation Error: You must specify either an ID or a related field and neither was specified.`
			);

		graphweaverMetadata.collectFieldInformation({
			name: key,
			getType: returnTypeFunc,
			nullable,
			target: target as new (...args: any[]) => unknown,
			relationshipInfo: {
				relatedField,
				id,
			},
			...remainingOptions,
		});
	};
}
