import { useField, useFormikContext } from 'formik';
import { Link, useNavigate } from 'react-router-dom';
import { EntityField, routeFor, useSchema } from '../../utils';

export const LinkField = ({ name, entity }: { name: string; entity: EntityField }) => {
	const { dirty } = useFormikContext();
	const navigate = useNavigate();
	const [_, meta, helpers] = useField({ name: name, multiple: false });
	const { initialValue: formEntity } = meta;

	// Handle if the form has changed when clicking a link, if it has pop up a confirmation modal
	const handleLinkClick = (e: React.MouseEvent<HTMLAnchorElement, MouseEvent>, route: string) => {
		e.preventDefault();
		if (dirty) {
			// @todo: implement confirmation modal
		} else {
			navigate(route);
		}
	};

	return entity.relationshipType === 'ONE_TO_ONE' || entity.relationshipType === 'MANY_TO_ONE' ? (
		<a
			key={formEntity.id}
			onClick={(e) =>
				handleLinkClick(e, routeFor({ type: entity.type, id: formEntity.id as string }))
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
	);
};
