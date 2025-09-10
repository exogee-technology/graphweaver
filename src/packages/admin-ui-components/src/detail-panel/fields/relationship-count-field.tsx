import { useField, useFormikContext } from 'formik';

import { Entity, EntityField, routeFor, useSchema } from '../../utils';
import { useLocation, useSearchParams } from 'wouter';
import { useCallback } from 'react';
import styles from '../styles.module.css';

// This field is used when a relationship has too many items to even fetch them all,
// so we just show a count of the items with a link to the table filtered to those matching
// items instead.
export const RelationshipCountField = ({
	name,
	field,
	entity,
}: {
	name: string;
	field: EntityField;
	entity: Entity;
}) => {
	const { dirty } = useFormikContext();
	const [, setLocation] = useLocation();
	const { entityByType } = useSchema();
	const relatedEntity = entityByType(field.type);
	const [_, meta] = useField({ name, multiple: false });
	const [primaryKey] = useField({ name: entity.primaryKeyField, multiple: false });
	const { initialValue: formEntity } = meta;
	const [__, setSearchParams] = useSearchParams();

	// Handle case where relatedEntity is not found
	if (!relatedEntity) {
		return <div>Error: Related entity {field.type} not found</div>;
	}

	const handleLinkClick = useCallback(
		(e: React.MouseEvent<HTMLAnchorElement, MouseEvent>) => {
			// Handle if the form has changed when clicking a link, if it has pop up a confirmation modal
			e.preventDefault();

			// Figure out the property that points the other direction, e.g. back at us.
			// If we're on Genre and we're showing a count of tracks, clicking needs to filter
			// tracks { genre : { id: 1 } }
			const inverseRelationship = relatedEntity.fields.find((field) => field.type === entity.name);

			if (!inverseRelationship) return;

			const route = routeFor({
				type: field.type,
				filters: { [inverseRelationship.name]: { [entity.primaryKeyField]: primaryKey.value } },
			});

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

	return (
		<a key={formEntity.id} className={styles.relationshipLink} onClick={handleLinkClick}>
			{formEntity?.count ?? 0} {relatedEntity.plural.toLowerCase()}
		</a>
	);
};
