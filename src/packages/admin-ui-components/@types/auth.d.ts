declare module 'virtual:graphweaver-auth-ui-components' {
	import { JSX } from 'react';
	export const SignOut: () => JSX.Element | null;
	export const customFields: Map<string, CustomField[]> | undefined;
}
