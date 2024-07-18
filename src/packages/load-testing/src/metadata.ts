import http from 'k6/http';
import { sleep } from 'k6';

import { url } from './config';

export const options = {
	vus: 10,
	duration: '30s',
};

export default function () {
	http.post(
		url,
		'{"operationName":"graphweaver","variables":{},"query":"query graphweaver {\n  result: _graphweaver {\n    entities {\n      name\n      plural\n      backendId\n      summaryField\n      defaultFilter\n      fields {\n        name\n        type\n        isArray\n        relationshipType\n        relatedEntity\n        filter {\n          type\n          __typename\n        }\n        attributes {\n          isReadOnly\n          isRequired\n          __typename\n        }\n        extensions {\n          key\n          __typename\n        }\n        __typename\n      }\n      attributes {\n        isReadOnly\n        exportPageSize\n        __typename\n      }\n      __typename\n    }\n    enums {\n      name\n      values {\n        name\n        value\n        __typename\n      }\n      __typename\n    }\n    __typename\n  }\n}"}',
		{
			headers: {
				'Content-Type': 'application/json',
			},
		}
	);
	sleep(1);
}
