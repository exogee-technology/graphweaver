const documentNodeTypes = `/* eslint-disable */

import type { DocumentNode as GqlDocumentNode } from 'graphql';

export interface DocumentTypeDecoration<TResult, TVariables> {
	/**
	 * This type is used to ensure that the variables you pass in to the query are assignable to Variables
	 * and that the Result is assignable to whatever you pass your result to. The method is never actually
	 * implemented, but the type is valid because we list it as optional
	 */
	__apiType?: (variables: TVariables) => TResult;
}

export interface DocumentNode<TResult = { [key: string]: any }, TVariables = { [key: string]: any }>
	extends GqlDocumentNode,
		DocumentTypeDecoration<TResult, TVariables> {}`;

const documentNodeImport = `import { TypedDocumentNode as DocumentNode } from '@graphql-typed-document-node/core';`;

export const patch = (input: string) => {
	return input.replace(documentNodeImport, documentNodeTypes);
};
