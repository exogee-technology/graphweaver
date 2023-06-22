import { MouseEventHandler } from 'react';
import { Task, TasksDocument } from '../../types';
import { useQuery } from '@apollo/client';

import { ReactComponent as OpenIcon } from '../assets/16-open-external.svg';

const tasksQueryDocument = /* GraphQL */ `
	query Tasks {
		tasks {
			id
			description
			user {
				id
			}
		}
	}
`;

export const Link = (task: Task) => {
	const { data, error, loading } = useQuery(TasksDocument, {
		fetchPolicy: 'network-only',
	});

	data.tasks.map((task) => {
		task.tag;
	});

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
