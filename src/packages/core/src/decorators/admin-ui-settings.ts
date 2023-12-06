import { AdminUISettingsMap } from '..';

type Props = {
	filter?: {
		hide: true;
	};
	entity?: {
		hide: true;
	};
};

export function AdminUISettings(settings?: Props) {
	const entity = settings?.entity;
	const filter = settings?.filter;

	return (target: any, propertyKey?: string | symbol) => {
		const entityName = target.name || target.constructor.name;
		const settings = AdminUISettingsMap.get(entityName)
			? AdminUISettingsMap.get(entityName) ?? {}
			: {};

		if (filter) {
			if (!settings.fields) settings.fields = {};
			settings.fields[propertyKey as keyof typeof settings.fields] = {
				filter,
			};
		}

		if (entity) {
			settings.entity = {
				hide: entity.hide,
			};
		}

		AdminUISettingsMap.set(entityName, settings);
	};
}
