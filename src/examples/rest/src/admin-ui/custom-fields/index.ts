import { CustomField } from '@exogee/graphweaver-admin-ui-components';
import {
	ConfirmComponent,
	PasswordComponent,
	SecretFieldComponent,
} from '@exogee/graphweaver-auth-ui-components';

import { Link } from './link';

export const customFields = new Map<string, CustomField[]>();
customFields.set('Task', [
	{
		name: 'search',
		type: 'custom',
		index: 3,
		component: Link,
		hideInDetailForm: true,
	},
]);

customFields.set('Credential', [
	{
		name: 'password',
		type: 'custom',
		component: PasswordComponent,
		hideInTable: true,
		initialValue: '',
	},
	{
		name: 'confirm',
		type: 'custom',
		component: ConfirmComponent,
		hideInTable: true,
		initialValue: '',
	},
]);

// Contains the generate secret and api key button
customFields.set('ApiKey', [
	{
		name: 'secret',
		type: 'custom',
		component: SecretFieldComponent,
		hideInTable: true,
		initialValue: '',
	},
]);
