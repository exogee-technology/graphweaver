import {
	AdminUISettingsOptions,
	AdminUISettingsMap,
	BaseDataEntity,
	GraphQLEntity,
	GraphQLEntityConstructor,
} from '..';

export function AdminUISettings<G extends GraphQLEntity<D>, D extends BaseDataEntity>(
	props?: AdminUISettingsOptions<G>
) {
	return (target: GraphQLEntityConstructor<G, D>, propertyKey?: string | symbol) => {
		const entityName = target.name || target.constructor.name;
		const settings = AdminUISettingsMap.get(entityName)
			? AdminUISettingsMap.get(entityName) ?? {}
			: {};

		if (propertyKey) {
			if (!settings.fields) settings.fields = {};
			settings.fields[propertyKey as keyof typeof settings.fields] = { ...props };
		} else {
			settings.entity = { ...props };
		}

		AdminUISettingsMap.set(entityName, settings);
	};
}
