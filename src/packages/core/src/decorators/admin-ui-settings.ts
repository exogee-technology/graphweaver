import { AdminUISettingsMap } from '..';
import { AdminUIFilterType } from '../common/types';

type Props = {
	filter?: {
		type: AdminUIFilterType;
	};
};

export function AdminUISettings(settings?: Props) {
	const filter = settings?.filter;

	return (target: any, propertyKey: string | symbol) => {
		const entityName = target.constructor.name;
		const settings = AdminUISettingsMap.get(entityName)
			? AdminUISettingsMap.get(entityName) ?? {}
			: {};

		if (filter) {
			if (!settings.fields) settings.fields = {};
			settings.fields[propertyKey as keyof typeof settings.fields] = {
				filter,
			};
		}

		AdminUISettingsMap.set(entityName, settings);
	};
}
