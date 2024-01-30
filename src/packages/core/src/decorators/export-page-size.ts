import 'reflect-metadata';

const exportPageSizeKey = Symbol('GraphweaverExportPageSize');

export function ExportPageSize(value: number) {
	return function (target: any) {
		Reflect.defineMetadata(exportPageSizeKey, value, target);
	};
}

export function getExportPageSize(target: any) {
	return Reflect.getMetadata(exportPageSizeKey, target);
}
