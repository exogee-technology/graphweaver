export declare const Filter: <T extends {
    name: string;
}>(GraphqlEntityType: () => T) => ({ constructor: target }: any, methodName: string, index: number) => void;
