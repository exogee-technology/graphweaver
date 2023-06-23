const documentNodeImport = `import { TypedDocumentNode as DocumentNode } from '@graphql-typed-document-node/core';`;
const documentNodeTypes = `import type { DocumentNode as GqlDocumentNode } from 'graphql';

interface DocumentTypeDecoration<TResult, TVariables> {
	/**
	 * This type is used to ensure that the variables you pass in to the query are assignable to Variables
	 * and that the Result is assignable to whatever you pass your result to. The method is never actually
	 * implemented, but the type is valid because we list it as optional
	 */
	__apiType?: (variables: TVariables) => TResult;
}

interface DocumentNode<TResult = { [key: string]: any }, TVariables = { [key: string]: any }>
	extends GqlDocumentNode,
		DocumentTypeDecoration<TResult, TVariables> {}
		
`;

const findIndex = `export * from "./fragment-masking";\nexport * from "./gql";`;
const replaceIndex = `/* eslint-disable */
export * from "./fragment-masking";
export * from "./gql";
export * from "./graphql";`;

const findFragment = `import { ResultOf, DocumentTypeDecoration, TypedDocumentNode } from '@graphql-typed-document-node/core';`;

const replaceFragment = `/* eslint-disable */
import type { DocumentNode as GqlDocumentNode } from 'graphql';

interface DocumentTypeDecoration<TResult, TVariables> {
	/**
	 * This type is used to ensure that the variables you pass in to the query are assignable to Variables
	 * and that the Result is assignable to whatever you pass your result to. The method is never actually
	 * implemented, but the type is valid because we list it as optional
	 */
	__apiType?: (variables: TVariables) => TResult;
}

interface TypedDocumentNode<TResult = { [key: string]: any }, TVariables = { [key: string]: any }>
	extends GqlDocumentNode,
		DocumentTypeDecoration<TResult, TVariables> {}

/**
 * Helper for extracting a TypeScript type for operation result from a TypedDocumentNode and TypedDocumentString.
 * @example
 * const myQuery = { ... }; // TypedDocumentNode<R, V>
 * type ResultType = ResultOf<typeof myQuery>; // Now it's R
 */
type ResultOf<T> = T extends DocumentTypeDecoration<infer ResultType, infer VariablesType>
	? ResultType
	: never;`;

const patchMap = {
	['./src/__generated__/fragment-masking.ts']: {
		find: findFragment,
		replace: replaceFragment,
	},
	['./src/__generated__/index.ts']: { find: findIndex, replace: replaceIndex },
	['./src/__generated__/gql.ts']: { find: '', replace: '' },
	['./src/__generated__/graphql.ts']: {
		find: documentNodeImport,
		replace: documentNodeTypes,
	},
};

export const patchFile = (filename: string, contents: string) => {
	const patch = patchMap[filename as keyof typeof patchMap];
	return contents.replace(patch.find, patch.replace);
};
