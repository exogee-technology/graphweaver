declare module 'virtual:graphweaver-admin-ui-csv-export-overrides' {
	import type { Entity } from '@exogee/graphweaver-admin-ui';
	import type { QueryOptions } from '@apollo/client';

	export interface EntitySpecificCsvExportOverride {
		// If provided, we'll use this instead of our standard query. Pagination, filtering, sorting, etc. will be supplied as arguments
		// to your filter.
		// Supplying both `query` and `queryOptions` is not supported. queryOptions gives you more ability to override the export behaviour, but in
		// most cases, just overriding the query to get extra fields out, or omit fields you don't want is enough.
		// If you return a string, it'll get parsed with gql() before going to the server.
		// If the function returns undefined, we'll use the default query for the entity for that page and call you back again for the next one.
		//
		// The query must have results aliased to be named `result` in the response.
		//
		// If an `aggregation` field is present in the result, we'll use this to provide a total number of pages. The default query
		// aliases an aggregation result there with the shape { count } so a total number of pages can be provided to the user during
		// the export.
		query?:
			| DocumentNode
			| Promise<DocumentNode>
			| ((
					// This is the entity metadata for the entity being exported.
					entity: Entity,
					// This function can be used to get the entity metadata for other entities as needed.
					entityByName: (entityType: string) => Entity
			  ) => Promise<DocumentNode | undefined> | DocumentNode | undefined);

		// If provided, we'll pass you the info we have and you can return a different query, map pagination, filtering, sorting, etc.
		// This is a low level override and is usually not needed, most likely you'll just want to override the query above.
		// Specifying `queryOptions` as well as `query` is an error. Only one can be specified. If you want to override the query while
		// also overriding the query options, you can do that by returning the `query` key in the response.
		// If the function returns undefined, we'll use the default query for the entity for that page
		// and call you back again for the next one.
		//
		// Note: It's likely you'll want to return `fetchPolicy: 'no-cache'` in your response so that you'll definitely get fresh data on the export.
		//
		// We have specific behaviour around the `aggregation` field in the result. If you want to provide a total number of pages, you'll need to alias your
		// query such that the aggregation field is present the way the default query does.
		queryOptions?: (args: {
			selectedEntity: Entity;
			entityByName: (entityType: string) => Entity;
			pageNumber: number;
			pageSize: number;
			sort: SortEntity;
			filters: Filter;
		}) => Promise<QueryOptions<any, any> | undefined> | QueryOptions<any, any> | undefined;

		// If provided, this will be called after all data is fetched and before passing to the CSV export. This allows you to override the columns and/or
		// rows in the resulting CSV export.
		mapResults?: (csvExportRows: Row<TData>[]) => Promise<Row<TData>[]> | Row<TData>[];
	}

	export interface CsvExportOverridesExport {
		[entityName: string]: EntitySpecificCsvExportOverride;
	}

	export const csvExportOverrides: CsvExportOverridesExport;
}
