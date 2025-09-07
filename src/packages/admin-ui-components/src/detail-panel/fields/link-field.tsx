import { useField, useFormikContext } from 'formik';
import { useLocation, useSearchParams } from 'wouter';
import { EntityField, routeFor } from '../../utils';

export const LinkField = ({ name, field }: { name: string; field: EntityField }) => {
	const { dirty } = useFormikContext();
	const [, setLocation] = useLocation();
	const [_, meta] = useField({ name: name, multiple: false });
	const { initialValue: formEntity } = meta;
	const [__, setSearchParams] = useSearchParams();

	// Handle if the form has changed when clicking a link, if it has pop up a confirmation modal
	const handleLinkClick = (e: React.MouseEvent<HTMLAnchorElement, MouseEvent>, route: string) => {
		e.preventDefault();
		if (dirty) {
			// Push the route to this link onto the searchParams
			// this will be used in the confirmation modal to navigate
			const searchParams = new URLSearchParams(location.search);

			searchParams.set('modalRedirectUrl', route);
			setSearchParams(searchParams);
		} else {
			setLocation(route);
		}
	};

	// For when there is no entity on the other side of the relationship
	if (!formEntity) return <span>—</span>;

	return (
		<>
			{field.relationshipType === 'ONE_TO_ONE' || field.relationshipType === 'MANY_TO_ONE' ? (
				<a
					key={formEntity.id}
					onClick={(e) =>
						handleLinkClick(e, routeFor({ type: field.type, id: formEntity.value as string }))
					}
				>
					{formEntity.label}
				</a>
			) : (
				<>
					{formEntity.map((value: any) => {
						return (
							<a
								key={value.value}
								onClick={(e) =>
									handleLinkClick(e, routeFor({ type: field.type, id: value.value as string }))
								}
							>
								{value.label}
							</a>
						);
					})}
				</>
			)}
		</>
	);
};
