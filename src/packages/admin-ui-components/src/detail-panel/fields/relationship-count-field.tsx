import { useQuery } from '@apollo/client';
import { useField, useFormikContext } from 'formik';

import { EntityField, routeFor, useSchema } from '../../utils';
import { getRelationshipCountQuery } from '../graphql';
import { Spinner } from '../../spinner';
import { useLocation, useSearchParams } from 'wouter';
import { useCallback } from 'react';

// This field is used when a relationship has too many items to even fetch them all,
// so we just show a count of the items with a link to the table filtered to those matching
// items instead.
export const RelationshipCountField = ({ name, field }: { name: string; field: EntityField }) => {
	const { dirty } = useFormikContext();
	const [, setLocation] = useLocation();
	const [{ value }] = useField({ name, multiple: false });
	const { entityByType } = useSchema();
	const relatedEntity = entityByType(field.type);
	const [_, meta] = useField({ name: name, multiple: false });
	const [__, setSearchParams] = useSearchParams();
	const { data, loading, error } = useQuery(getRelationshipCountQuery(relatedEntity), {
		variables: {
			filter: {
				[relatedEntity.primaryKeyField]: value,
			},
		},
	});
	const { initialValue: formEntity } = meta;

	const handleLinkClick = useCallback(
		(e: React.MouseEvent<HTMLAnchorElement, MouseEvent>) => {
			// Handle if the form has changed when clicking a link, if it has pop up a confirmation modal
			e.preventDefault();

			const route = routeFor({ type: field.type, id: formEntity.value as string });

			if (dirty) {
				// Push the route to this link onto the searchParams
				// this will be used in the confirmation modal to navigate
				const searchParams = new URLSearchParams(location.search);

				searchParams.set('modalRedirectUrl', route);
				setSearchParams(searchParams);
			} else {
				setLocation(route);
			}
		},
		[dirty, setLocation, setSearchParams, formEntity.value, field.type, location.search]
	);

	if (loading) return <Spinner />;
	if (error) return <div>Error: {error.message}</div>;

	return (
		<a key={formEntity.id} onClick={handleLinkClick}>
			{data?.result?.count ?? 0} [entity name]s
		</a>
	);
};
