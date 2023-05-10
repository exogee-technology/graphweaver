import { CustomField } from '@exogee/graphweaver-admin-ui-components';
import { Link } from './link';

export type Task = {
	user: {
		name: string;
	};
};

export const customFields = new Map<string, CustomField[]>();
customFields.set('Task', [
	{
		name: 'search',
		type: 'custom',
		index: 3,
		component: Link,
	},
]);
