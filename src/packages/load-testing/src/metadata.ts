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

export default function () {
	const res = http.post(
		url,
		JSON.stringify({
			operationName: 'graphweaver',
			variables: {},
			query:
				'query graphweaver {\n  result: _graphweaver {\n    entities {\n      name\n      plural\n      backendId\n      summaryField\n      defaultFilter\n      fields {\n        name\n        type\n        isArray\n        relationshipType\n        relatedEntity\n        filter {\n          type\n          __typename\n        }\n        attributes {\n          isReadOnly\n          isRequired\n          __typename\n        }\n        extensions {\n          key\n          __typename\n        }\n        __typename\n      }\n      attributes {\n        isReadOnly\n        exportPageSize\n        __typename\n      }\n      __typename\n    }\n    enums {\n      name\n      values {\n        name\n        value\n        __typename\n      }\n      __typename\n    }\n    __typename\n  }\n}',
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
