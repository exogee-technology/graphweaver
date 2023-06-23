import { MouseEventHandler } from 'react';
import { useQuery } from '@apollo/client';

import { Task, TaskDocument, graphql } from '../../__generated__';
import { ReactComponent as OpenIcon } from '../assets/16-open-external.svg';

graphql(`
	query Task {
		task(id: "2") {
			id
			description
			user {
				id
				name
			}
		}
	}
`);

export const Link = (task: Task) => {
	const { data } = useQuery(TaskDocument, {
		fetchPolicy: 'network-only',
	});

	data.task.user.name;

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
