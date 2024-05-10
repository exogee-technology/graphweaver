import {
	BaseContext,
	FieldOptions,
	GraphQLResolveInfo,
	graphweaverMetadata,
} from '@exogee/graphweaver';
import { S3StorageProvider } from '../storageProvider';
import { Source } from 'graphql';
import { GraphQLJSON } from '@exogee/graphweaver-scalars';

export type Media = {
	filename: string;
	url?: string;
};

export enum MediaTypes {
	IMAGE = 'Image',
	OTHER = 'Other',
}

type MediaTypeFieldOptions = FieldOptions & {
	storageProvider: S3StorageProvider;
};

// interface MediaDataEntity extends BaseDataEntity {
// 	filename: string;
// 	url: string;
// }

// @Entity('Media')
// class MediaFieldEntity extends GraphQLEntity<MediaDataEntity> {
// 	public dataEntity!: MediaDataEntity;

// 	@Field(() => GraphQLString)
// 	filename!: string;

// 	@Field(() => GraphQLString, { apiOptions: { excludeFromBuiltInWriteOperations: true } })
// 	url!: string;
// }

// function identity(value: any) {
// 	return value;
// }

// function ensureObject(value: any) {
// 	if (typeof value !== 'object' || value === null || Array.isArray(value)) {
// 		throw new TypeError(`JSONObject cannot represent non-object value: ${value}`);
// 	}

// 	return value;
// }

// function parseObject(typeName: any, ast: any, variables: any) {
// 	const value = Object.create(null);
// 	ast.fields.forEach((field: any) => {
// 		// eslint-disable-next-line no-use-before-define
// 		value[field.name.value] = parseLiteral(typeName, field.value, variables);
// 	});

// 	return value;
// }

// function parseLiteral(typeName: any, ast: any, variables: any) {
// 	switch (ast.kind) {
// 		case Kind.STRING:
// 		case Kind.BOOLEAN:
// 			return ast.value;
// 		case Kind.INT:
// 		case Kind.FLOAT:
// 			return parseFloat(ast.value);
// 		case Kind.OBJECT:
// 			return parseObject(typeName, ast, variables);
// 		case Kind.LIST:
// 			return ast.values.map((n: any) => parseLiteral(typeName, n, variables));
// 		case Kind.NULL:
// 			return null;
// 		case Kind.VARIABLE:
// 			return variables ? variables[ast.name.value] : undefined;
// 		default:
// 			throw new TypeError(`${typeName} cannot represent value: ${print(ast)}`);
// 	}
// }

// export const GraphQLMediaType = new GraphQLScalarType({
// 	name: 'Media',
// 	description: `filename: String!;\nurl: String!;`,
// 	serialize: ensureObject,
// 	parseValue: ensureObject,
// 	parseLiteral: (ast, variables) => {
// 		if (ast.kind !== Kind.OBJECT) {
// 			throw new TypeError(`JSONObject cannot represent non-object value: ${print(ast)}`);
// 		}

// 		return parseObject('JSONObject', ast, variables);
// 	},
// });

// const GraphQLMediaType = new GraphQLObjectType({
// 	name: 'Media',

// 	fields: {
// 		filename: { type: GraphQLString },
// 		url: { type: GraphQLString },
// 	},
// });

export function MediaField(options: MediaTypeFieldOptions): PropertyDecorator {
	return function (target: any, propertyKey: string | symbol) {
		if (typeof propertyKey === 'symbol') {
			throw new Error(`@DownloadUrlField decorator key must be a string.`);
		}

		graphweaverMetadata.collectFieldInformation({
			target,
			name: propertyKey,
			getType: () => GraphQLJSON,
			adminUIOptions: {
				readonly: true,
			},
			nullable: true,
			excludeFromFilterType: true,
			...options,
		});

		const fieldResolver = async (
			source: Source & { dataEntity: Record<string, string> },
			args: unknown,
			context: BaseContext,
			info: GraphQLResolveInfo
		) => {
			return {
				filename: source.dataEntity[propertyKey],
				url: await options.storageProvider.getDownloadUrl(
					source,
					{ key: source.dataEntity[propertyKey] as string },
					context,
					info
				),
			};
		};

		Object.defineProperty(target, propertyKey, {
			enumerable: true,
			configurable: true,
			value: fieldResolver,
		});
	};
}
