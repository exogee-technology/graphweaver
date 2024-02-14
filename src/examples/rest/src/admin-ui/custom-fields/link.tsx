import { MouseEventHandler } from 'react';
import { useFormikContext } from 'formik';

import { ReactComponent as OpenIcon } from '../assets/16-open-external.svg';
import { CustomFieldArgs } from '@exogee/graphweaver-admin-ui-components';

interface Task {
	user: {
		label: string;
		value: string;
	};
}

export const Link = ({ entity }: CustomFieldArgs<Task>) => {
	const context = useFormikContext();

	console.log('Custom field values', context);

	const handleClick = (e: MouseEventHandler<HTMLDivElement>) => {
		e.preventDefault();
		e.stopPropagation();
		window.open(`https://google.com/search?q=${entity.user.label}`, '_blank', 'noreferrer');
	};
	return (
		<div style={{ cursor: 'pointer' }} onClick={handleClick}>
			<OpenIcon />
		</div>
	);
};
