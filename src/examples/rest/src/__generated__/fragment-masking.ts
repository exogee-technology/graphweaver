/* eslint-disable */

import type { DocumentNode as GqlDocumentNode } from 'graphql';

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
		
/**
 * Helper for extracting a TypeScript type for operation result from a TypedDocumentNode and TypedDocumentString.
 * @example
 * const myQuery = { ... }; // TypedDocumentNode<R, V>
 * type ResultType = ResultOf<typeof myQuery>; // Now it's R
 */
type ResultOf<T> = T extends DocumentTypeDecoration<
  infer ResultType,
  infer VariablesType
>
  ? ResultType
  : never;

import { FragmentDefinitionNode } from 'graphql';
import { Incremental } from './graphql';


export type FragmentType<TDocumentType extends DocumentTypeDecoration<any, any>> = TDocumentType extends DocumentTypeDecoration<
  infer TType,
  any
>
  ? [TType] extends [{ ' $fragmentName'?: infer TKey }]
    ? TKey extends string
      ? { ' $fragmentRefs'?: { [key in TKey]: TType } }
      : never
    : never
  : never;

// return non-nullable if `fragmentType` is non-nullable
export function useFragment<TType>(
  _documentNode: DocumentTypeDecoration<TType, any>,
  fragmentType: FragmentType<DocumentTypeDecoration<TType, any>>
): TType;
// return nullable if `fragmentType` is nullable
export function useFragment<TType>(
  _documentNode: DocumentTypeDecoration<TType, any>,
  fragmentType: FragmentType<DocumentTypeDecoration<TType, any>> | null | undefined
): TType | null | undefined;
// return array of non-nullable if `fragmentType` is array of non-nullable
export function useFragment<TType>(
  _documentNode: DocumentTypeDecoration<TType, any>,
  fragmentType: ReadonlyArray<FragmentType<DocumentTypeDecoration<TType, any>>>
): ReadonlyArray<TType>;
// return array of nullable if `fragmentType` is array of nullable
export function useFragment<TType>(
  _documentNode: DocumentTypeDecoration<TType, any>,
  fragmentType: ReadonlyArray<FragmentType<DocumentTypeDecoration<TType, any>>> | null | undefined
): ReadonlyArray<TType> | null | undefined;
export function useFragment<TType>(
  _documentNode: DocumentTypeDecoration<TType, any>,
  fragmentType: FragmentType<DocumentTypeDecoration<TType, any>> | ReadonlyArray<FragmentType<DocumentTypeDecoration<TType, any>>> | null | undefined
): TType | ReadonlyArray<TType> | null | undefined {
  return fragmentType as any;
}


export function makeFragmentData<
  F extends DocumentTypeDecoration<any, any>,
  FT extends ResultOf<F>
>(data: FT, _fragment: F): FragmentType<F> {
  return data as FragmentType<F>;
}
export function isFragmentReady<TQuery, TFrag>(
  queryNode: DocumentTypeDecoration<TQuery, any>,
  fragmentNode: TypedDocumentNode<TFrag>,
  data: FragmentType<TypedDocumentNode<Incremental<TFrag>, any>> | null | undefined
): data is FragmentType<typeof fragmentNode> {
  const deferredFields = (queryNode as { __meta__?: { deferredFields: Record<string, (keyof TFrag)[]> } }).__meta__
    ?.deferredFields;

  if (!deferredFields) return true;

  const fragDef = fragmentNode.definitions[0] as FragmentDefinitionNode | undefined;
  const fragName = fragDef?.name?.value;

  const fields = (fragName && deferredFields[fragName]) || [];
  return fields.length > 0 && fields.every(field => data && field in data);
}
