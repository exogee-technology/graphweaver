import { AdminUIEntitySettings, AdminUISettingsMap, BaseDataEntity, GraphQLEntity } from '..';

export function AdminUISettings<
	G extends GraphQLEntity<BaseDataEntity> = GraphQLEntity<BaseDataEntity>
>(props?: AdminUIEntitySettings<G>) {
	return (target: any, propertyKey?: string | symbol) => {
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
