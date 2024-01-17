import 'reflect-metadata';

const readOnlyBackendKey = Symbol('BaseResolverReadOnlyBackend');
const readOnlyAdminUIKey = Symbol('BaseResolverReadOnlyAdminUI');

type Props = {
	backend?: boolean;
	adminUI?: boolean;
};

export function ReadOnly({ backend, adminUI }: Props = { backend: true, adminUI: true }) {
	return (target: any, propertyKey?: string | symbol) => {
		if (propertyKey) {
			if (adminUI) Reflect.metadata(readOnlyAdminUIKey, true)(target, propertyKey);
			if (backend) Reflect.metadata(readOnlyBackendKey, true)(target, propertyKey);
			return;
		}

		if (adminUI) Reflect.metadata(readOnlyAdminUIKey, true)(target);
		if (backend) Reflect.metadata(readOnlyBackendKey, true)(target);
		return target;
	};
}

export function isReadOnlyBackend(target: any) {
	return !!Reflect.getMetadata(readOnlyBackendKey, target);
}

export function isReadOnlyAdminUI(target: any) {
	return !!Reflect.getMetadata(readOnlyAdminUIKey, target);
}
