import { GraphQLEntityConstructor } from './base-entity';
export declare const BaseLoaders: {
    loadOne: <T>({ gqlEntityType, id, }: {
        gqlEntityType: GraphQLEntityConstructor<T>;
        id: string;
    }) => Promise<T>;
    loadByRelatedId: <T_1>(args: {
        gqlEntityType: GraphQLEntityConstructor<T_1>;
        relatedField: keyof T_1 & string;
        id: string;
    }) => Promise<T_1[]>;
    clearCache: () => void;
};
