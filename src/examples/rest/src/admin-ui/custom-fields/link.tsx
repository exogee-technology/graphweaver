import { MouseEventHandler } from 'react';

import { Task } from '../../types.generated';
import { ReactComponent as OpenIcon } from '../assets/16-open-external.svg';

export const Link = (task: Task) => {
	const handleClick = (e: MouseEventHandler<HTMLDivElement>) => {
		e.preventDefault();
		e.stopPropagation();
		window.open(`https://google.com/search?q=${task.user.name}`, '_blank', 'noreferrer');
	};
	return (
		<div style={{ cursor: 'pointer' }} onClick={handleClick}>
			<OpenIcon />
		</div>
	);
};
