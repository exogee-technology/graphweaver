import { CustomField } from '@exogee/graphweaver-admin-ui-components';
import { ConfirmComponent, PasswordComponent, SecretFieldComponent } from './components';

export const customFields = new Map<string, CustomField[]>();

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
