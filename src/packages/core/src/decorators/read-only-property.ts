import 'reflect-metadata';

const readOnlyPropertyBackendKey = Symbol('BaseResolverReadOnlyBackend');
const readOnlyPropertyAdminUIKey = Symbol('BaseResolverReadOnlyAdminUI');

type Props = {
	backend?: boolean;
	adminUI?: boolean;
};

export function ReadOnlyProperty({ backend, adminUI }: Props = { backend: true, adminUI: true }) {
	return (target: any, propertyKey: string | symbol) => {
		// console.log('****************************\n');
		// console.log('propertyKey', propertyKey);
		// console.log('target', target);
		// console.log('target.constructor', target.constructor);
		// console.log('backend', backend);
		// console.log('adminUI', adminUI);
		// console.log('****************************\n');
		if (propertyKey) {
			if (adminUI)
				Reflect.metadata(readOnlyPropertyAdminUIKey, true)(target.constructor, propertyKey);
			if (backend)
				Reflect.metadata(readOnlyPropertyBackendKey, true)(target.constructor, propertyKey);
			return;
		}
		if (adminUI) Reflect.metadata(readOnlyPropertyAdminUIKey, true)(target.constructor);
		if (backend) Reflect.metadata(readOnlyPropertyBackendKey, true)(target.constructor);
		return target;
	};
}

export function isReadOnlyPropertyBackend(target: any, propertyKey: string) {
	return !!Reflect.getMetadata(readOnlyPropertyBackendKey, target, propertyKey);
}
export function isReadOnlyPropertyAdminUI(target: any, propertyKey: string) {
	return !!Reflect.getMetadata(readOnlyPropertyAdminUIKey, target, propertyKey);
}
