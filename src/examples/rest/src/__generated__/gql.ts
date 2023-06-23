/* eslint-disable */

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
		DocumentTypeDecoration<TResult, TVariables> {}

export const TasksDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"Tasks"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"tasks"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"tags"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}}]}}]}}]} as unknown as DocumentNode<TasksQuery, TasksQueryVariables>;
export type Maybe<T> = T | null;
export type InputMaybe<T> = Maybe<T>;
export type Exact<T extends { [key: string]: unknown }> = { [K in keyof T]: T[K] };
export type MakeOptional<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]?: Maybe<T[SubKey]> };
export type MakeMaybe<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]: Maybe<T[SubKey]> };
export type MakeEmpty<T extends { [key: string]: unknown }, K extends keyof T> = { [_ in K]?: never };
export type Incremental<T> = T | { [P in keyof T]?: P extends ' $fragmentName' | '__typename' ? T[P] : never };
/** All built-in and custom scalars, mapped to their actual values */
export type Scalars = {
  ID: { input: string | number; output: string; }
  String: { input: string; output: string; }
  Boolean: { input: boolean; output: boolean; }
  Int: { input: number; output: number; }
  Float: { input: number; output: number; }
};

export type Query = {
  __typename?: 'Query';
  users: Array<User>;
  user?: Maybe<User>;
  tags: Array<Tag>;
  tag?: Maybe<Tag>;
  tasks: Array<Task>;
  task?: Maybe<Task>;
  _graphweaver: AdminUiMetadata;
};

export type User = {
  __typename?: 'User';
  id: Scalars['ID']['output'];
  name: Scalars['String']['output'];
};

export type Tag = {
  __typename?: 'Tag';
  id: Scalars['ID']['output'];
  name: Scalars['String']['output'];
  tasks?: Maybe<Array<Task>>;
};

export type Task = {
  __typename?: 'Task';
  id: Scalars['ID']['output'];
  description: Scalars['String']['output'];
  user?: Maybe<User>;
  tags?: Maybe<Array<Tag>>;
};

export type AdminUiMetadata = {
  __typename?: 'AdminUiMetadata';
  entities: Array<AdminUiEntityMetadata>;
  enums: Array<AdminUiEnumMetadata>;
};

export type AdminUiEntityMetadata = {
  __typename?: 'AdminUiEntityMetadata';
  name: Scalars['String']['output'];
  backendId?: Maybe<Scalars['String']['output']>;
  summaryField?: Maybe<Scalars['String']['output']>;
  fields: Array<AdminUiFieldMetadata>;
};

export type AdminUiFieldMetadata = {
  __typename?: 'AdminUiFieldMetadata';
  name: Scalars['String']['output'];
  type: Scalars['String']['output'];
  relationshipType?: Maybe<Scalars['String']['output']>;
  relatedEntity?: Maybe<Scalars['String']['output']>;
  filter?: Maybe<AdminUiFilterMetadata>;
};

export type AdminUiFilterMetadata = {
  __typename?: 'AdminUiFilterMetadata';
  type: AdminUiFilterType;
};

export enum AdminUiFilterType {
  DateRange = 'DATE_RANGE',
  Enum = 'ENUM',
  Numeric = 'NUMERIC',
  Relationship = 'RELATIONSHIP',
  Text = 'TEXT'
}

export type AdminUiEnumMetadata = {
  __typename?: 'AdminUiEnumMetadata';
  name: Scalars['String']['output'];
  values: Array<AdminUiEnumValueMetadata>;
};

export type AdminUiEnumValueMetadata = {
  __typename?: 'AdminUiEnumValueMetadata';
  name: Scalars['String']['output'];
  value: Scalars['String']['output'];
};

export type Mutation = {
  __typename?: 'Mutation';
  login: Token;
  createUsers: Array<User>;
  createUser: User;
  updateUsers: Array<User>;
  createOrUpdateUsers: Array<User>;
  updateUser: User;
  deleteUser: Scalars['Boolean']['output'];
  createTags: Array<Tag>;
  createTag: Tag;
  updateTags: Array<Tag>;
  createOrUpdateTags: Array<Tag>;
  updateTag: Tag;
  deleteTag: Scalars['Boolean']['output'];
  createTasks: Array<Task>;
  createTask: Task;
  updateTasks: Array<Task>;
  createOrUpdateTasks: Array<Task>;
  updateTask: Task;
  deleteTask: Scalars['Boolean']['output'];
};

export type Token = {
  __typename?: 'Token';
  authToken: Scalars['String']['output'];
};

export type TasksQueryVariables = Exact<{ [key: string]: never; }>;


export type TasksQuery = { __typename?: 'Query', tasks: Array<{ __typename?: 'Task', id: string, description: string, tags?: Array<{ __typename?: 'Tag', id: string }> | null }> };

