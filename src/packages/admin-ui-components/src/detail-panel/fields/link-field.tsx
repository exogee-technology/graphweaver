import { useField, useFormikContext } from 'formik';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { EntityField, routeFor, useSchema } from '../../utils';

export const LinkField = ({ name, entity }: { name: string; entity: EntityField }) => {
	const { dirty } = useFormikContext();
	const navigate = useNavigate();
	const [_, meta, helpers] = useField({ name: name, multiple: false });
	const { initialValue: formEntity } = meta;
	const [searchParams, setSearchParams] = useSearchParams();

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
			navigate(route);
		}
	};

	return (
		<>
			{entity.relationshipType === 'ONE_TO_ONE' || entity.relationshipType === 'MANY_TO_ONE' ? (
				<a
					key={formEntity.id}
					onClick={(e) =>
						handleLinkClick(e, routeFor({ type: entity.type, id: formEntity.value as string }))
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
									handleLinkClick(e, routeFor({ type: entity.type, id: value.value as string }))
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
