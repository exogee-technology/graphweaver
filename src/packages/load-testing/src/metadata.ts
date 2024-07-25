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
query graphweaver {
  result: _graphweaver {
    entities {
			name
		}
	}
}`;

export default function () {
	const res = http.post(
		url,
		JSON.stringify({
			operationName: 'graphweaver',
			variables: {},
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
			return result.data && result.data.result.entities.length > 0;
		},
	});

	sleep(1);
}
