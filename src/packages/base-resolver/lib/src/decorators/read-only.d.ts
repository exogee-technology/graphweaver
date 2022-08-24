import 'reflect-metadata';
export declare function ReadOnly(): {
    (target: Function): void;
    (target: Object, propertyKey: string | symbol): void;
};
export declare function isReadOnly(target: any): boolean;
