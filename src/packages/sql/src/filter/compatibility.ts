/**
 * Opt-in compatibility with the MikroORM provider's filter semantics.
 *
 * Lives in its own module rather than on `SqlDataProvider` itself because `filter/` sits below the
 * provider and must not import it. `SqlDataProvider` exposes the flag as a static, which is where
 * anyone would look for it; this is just where the value is kept.
 */
export const filterCompatibility = {
	/** See `SqlDataProvider.treatRelationshipNullAsAbsent`. */
	treatRelationshipNullAsAbsent: false,
};
