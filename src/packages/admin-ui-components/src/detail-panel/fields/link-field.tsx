import { useField } from 'formik';
import { EntityField, routeFor, useSchema } from '../../utils';
import { Link } from 'react-router-dom';

export const LinkField = ({ name, entity }: { name: string; entity: EntityField }) => {
	const [_, meta, helpers] = useField({ name: name, multiple: false });
	console.log('meta', meta);
	const { entityByType } = useSchema();
	const { initialValue } = meta;
	const relationshipEntityType = entityByType(entity.type);
	console.log('relationshipEntityType', relationshipEntityType);
	console.log('initialValue', initialValue);

	// Handle if the form has changed when clicking a link, if it has pop up a confirmation modal

	return entity.relationshipType === 'ONE_TO_ONE' || entity.relationshipType === 'MANY_TO_ONE' ? (
		<Link
			key={initialValue.id}
			to={routeFor({ type: entity.type, id: initialValue.value as string })}
			// onClick={gobbleEvent}
		>
			{initialValue.label}
		</Link>
	) : (
		<>
			{initialValue.map((value: any) => (
				<Link
					key={value.id}
					to={routeFor({ type: value.type, id: value.value as string })}
					// onClick={gobbleEvent}
				>
					{value.label}
				</Link>
			))}
		</>
	);
};
