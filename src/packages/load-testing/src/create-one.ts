import http from 'k6/http';
import { check, sleep } from 'k6';

import { url } from './config';

export const options = {
	vus: 10,
	duration: '30s',
	thresholds: {
		checks: ['rate>=1'],
	},
};

const query = `
mutation createEntity($input: TaskInsertInput!) {
    createTask(input: $input) {
        id
    }
}`;

const variables = { input: { description: 'test', isCompleted: false, user: { id: '5' } } };

const ids = new Set<string>();

export default function () {
	const res = http.post(
		url,
		JSON.stringify({
			operationName: 'createEntity',
			variables,
			query,
		}),
		{
			headers: {
				'Content-Type': 'application/json',
			},
		}
	);

	check(res, {
		'Verify Response Status Code is Equal to 200': (r) => r.status === 200,
		'Verify Metadata Entities Returned': (r) => {
			const result = JSON.parse(r.body as string);

			if (result.errors) {
				console.error(result.errors);
				return false;
			}

			const valid = result.data && !ids.has(result.data.createTask?.id);

			if (valid) {
				ids.add(result.data.createTask.id);
			}

			return valid;
		},
	});

	sleep(1);
}
