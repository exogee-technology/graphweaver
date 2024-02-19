import {
	AdminUIEntitySettings,
	AdminUISettingsMap,
	BaseDataEntity,
	GraphQLEntity,
	GraphQLEntityConstructor,
	Filter,
} from '..';

// @todo This should be removed once we resolve https://exogee.atlassian.net/browse/EXOGW-325
// This is a temporary fix to expand the filter to the correct format
const expandFilter = (filter?: Filter<unknown>) => {
	if (!filter) return undefined;
	return Object.entries(filter).reduce((prev, [key, value]) => {
		return { ...prev, [key]: { [key]: value } };
	}, {});
};

export function AdminUISettings<G extends GraphQLEntity<D>, D extends BaseDataEntity>(
	props?: AdminUIEntitySettings<G>
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
			settings.entity = { ...props, defaultFilter: expandFilter(props?.defaultFilter) };
		}

		AdminUISettingsMap.set(entityName, settings);
	};
}
