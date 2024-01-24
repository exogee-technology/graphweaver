import { CustomField } from '@exogee/graphweaver-admin-ui-components';
import { ConfirmComponent, PasswordComponent } from '@exogee/graphweaver-auth-ui-components';

import { Link } from './link';

export const customFields = new Map<string, CustomField[]>();
customFields.set('Task', [
	{
		name: 'search',
		type: 'custom',
		index: 3,
		component: Link,
		hideOnDetailForm: true,
	},
]);

customFields.set('Credential', [
	{
		name: 'password',
		type: 'custom',
		component: PasswordComponent,
		hideOnTable: true,
		initialValue: '',
	},
	{
		name: 'confirm',
		type: 'custom',
		component: ConfirmComponent,
		hideOnTable: true,
		initialValue: '',
	},
]);
