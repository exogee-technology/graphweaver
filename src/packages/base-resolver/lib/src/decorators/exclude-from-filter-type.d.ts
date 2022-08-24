import 'reflect-metadata';
export declare function ExcludeFromFilterType(): (target: any, propertyKey: string | symbol) => void;
export declare function isExcludedFromFilterType(target: any, propertyKey: string): boolean;
