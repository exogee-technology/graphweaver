import 'reflect-metadata';
export declare function ExcludeFromInputTypes(): (target: any, propertyKey: string | symbol) => void;
export declare function isExcludedFromInputTypes(target: any, propertyKey: string): boolean;
