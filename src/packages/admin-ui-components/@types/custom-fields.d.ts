declare module 'virtual:graphweaver-user-supplied-custom-fields' {
	import { CustomField } from '../src';

	export const customFields: Map<string, CustomField[]> | undefined;
}
