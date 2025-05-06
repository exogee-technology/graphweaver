it('should correctly identify the field for a filter key where the field has multiple underscores in the name', () => {
	expect(
		graphweaverMetadata.fieldMetadataForFilterKey(
			stubEntityMetadata,
			'field_with_lots_of_underscores_gt'
		)?.getType()
	).toBe(String[]);
}); 