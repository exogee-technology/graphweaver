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
		

export type Maybe<T> = T | null;
export type InputMaybe<T> = Maybe<T>;
export type Exact<T extends { [key: string]: unknown }> = { [K in keyof T]: T[K] };
export type MakeOptional<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]?: Maybe<T[SubKey]> };
export type MakeMaybe<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]: Maybe<T[SubKey]> };
export type MakeEmpty<T extends { [key: string]: unknown }, K extends keyof T> = { [_ in K]?: never };
export type Incremental<T> = T | { [P in keyof T]?: P extends ' $fragmentName' | '__typename' ? T[P] : never };
/** All built-in and custom scalars, mapped to their actual values */
export type Scalars = {
  ID: { input: string; output: string; }
  String: { input: string; output: string; }
  Boolean: { input: boolean; output: boolean; }
  Int: { input: number; output: number; }
  Float: { input: number; output: number; }
};

export type AdminUiEntityMetadata = {
  __typename?: 'AdminUiEntityMetadata';
  backendId?: Maybe<Scalars['String']['output']>;
  fields: Array<AdminUiFieldMetadata>;
  name: Scalars['String']['output'];
  summaryField?: Maybe<Scalars['String']['output']>;
};

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

export type AdminUiFieldMetadata = {
  __typename?: 'AdminUiFieldMetadata';
  filter?: Maybe<AdminUiFilterMetadata>;
  name: Scalars['String']['output'];
  relatedEntity?: Maybe<Scalars['String']['output']>;
  relationshipType?: Maybe<Scalars['String']['output']>;
  type: Scalars['String']['output'];
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

export type AdminUiMetadata = {
  __typename?: 'AdminUiMetadata';
  entities: Array<AdminUiEntityMetadata>;
  enums: Array<AdminUiEnumMetadata>;
};

export type Mutation = {
  __typename?: 'Mutation';
  createOrUpdateTags: Array<Tag>;
  createOrUpdateTasks: Array<Task>;
  createOrUpdateUsers: Array<User>;
  createTag: Tag;
  createTags: Array<Tag>;
  createTask: Task;
  createTasks: Array<Task>;
  createUser: User;
  createUsers: Array<User>;
  deleteTag: Scalars['Boolean']['output'];
  deleteTask: Scalars['Boolean']['output'];
  deleteUser: Scalars['Boolean']['output'];
  login: Token;
  updateTag: Tag;
  updateTags: Array<Tag>;
  updateTask: Task;
  updateTasks: Array<Task>;
  updateUser: User;
  updateUsers: Array<User>;
};


export type MutationCreateOrUpdateTagsArgs = {
  input: TagsCreateOrUpdateManyInput;
};


export type MutationCreateOrUpdateTasksArgs = {
  input: TasksCreateOrUpdateManyInput;
};


export type MutationCreateOrUpdateUsersArgs = {
  input: UsersCreateOrUpdateManyInput;
};


export type MutationCreateTagArgs = {
  data: TagInsertInput;
};


export type MutationCreateTagsArgs = {
  input: TagsInsertManyInput;
};


export type MutationCreateTaskArgs = {
  data: TaskInsertInput;
};


export type MutationCreateTasksArgs = {
  input: TasksInsertManyInput;
};


export type MutationCreateUserArgs = {
  data: UserInsertInput;
};


export type MutationCreateUsersArgs = {
  input: UsersInsertManyInput;
};


export type MutationDeleteTagArgs = {
  id: Scalars['ID']['input'];
};


export type MutationDeleteTaskArgs = {
  id: Scalars['ID']['input'];
};


export type MutationDeleteUserArgs = {
  id: Scalars['ID']['input'];
};


export type MutationLoginArgs = {
  email: Scalars['String']['input'];
  password: Scalars['String']['input'];
};


export type MutationUpdateTagArgs = {
  data: TagCreateOrUpdateInput;
};


export type MutationUpdateTagsArgs = {
  input: TagsUpdateManyInput;
};


export type MutationUpdateTaskArgs = {
  data: TaskCreateOrUpdateInput;
};


export type MutationUpdateTasksArgs = {
  input: TasksUpdateManyInput;
};


export type MutationUpdateUserArgs = {
  data: UserCreateOrUpdateInput;
};


export type MutationUpdateUsersArgs = {
  input: UsersUpdateManyInput;
};

export enum Priority {
  /** HIGH */
  High = 'HIGH',
  /** LOW */
  Low = 'LOW',
  /** MEDIUM */
  Medium = 'MEDIUM'
}

export type Query = {
  __typename?: 'Query';
  _graphweaver: AdminUiMetadata;
  tag?: Maybe<Tag>;
  tags: Array<Tag>;
  task?: Maybe<Task>;
  tasks: Array<Task>;
  user?: Maybe<User>;
  users: Array<User>;
};


export type QueryTagArgs = {
  id: Scalars['ID']['input'];
};


export type QueryTagsArgs = {
  filter?: InputMaybe<TagsListFilter>;
  pagination?: InputMaybe<TagsPaginationInput>;
};


export type QueryTaskArgs = {
  id: Scalars['ID']['input'];
};


export type QueryTasksArgs = {
  filter?: InputMaybe<TasksListFilter>;
  pagination?: InputMaybe<TasksPaginationInput>;
};


export type QueryUserArgs = {
  id: Scalars['ID']['input'];
};


export type QueryUsersArgs = {
  filter?: InputMaybe<UsersListFilter>;
  pagination?: InputMaybe<UsersPaginationInput>;
};

export enum Sort {
  Asc = 'ASC',
  Desc = 'DESC'
}

export type Tag = {
  __typename?: 'Tag';
  id: Scalars['ID']['output'];
  name: Scalars['String']['output'];
  tasks?: Maybe<Array<Task>>;
};

export type TagCreateOrUpdateInput = {
  id?: InputMaybe<Scalars['ID']['input']>;
  name?: InputMaybe<Scalars['String']['input']>;
  tasks?: InputMaybe<Array<TaskCreateOrUpdateInput>>;
};

export type TagInsertInput = {
  name: Scalars['String']['input'];
  tasks?: InputMaybe<Array<TaskCreateOrUpdateInput>>;
};

export type TagsCreateOrUpdateManyInput = {
  data: Array<TagCreateOrUpdateInput>;
};

export type TagsInsertManyInput = {
  data: Array<TagInsertInput>;
};

export type TagsListFilter = {
  _and?: InputMaybe<Array<TagsListFilter>>;
  _not?: InputMaybe<TagsListFilter>;
  _or?: InputMaybe<Array<TagsListFilter>>;
  id?: InputMaybe<Scalars['ID']['input']>;
  id_in?: InputMaybe<Array<Scalars['ID']['input']>>;
  id_ne?: InputMaybe<Scalars['ID']['input']>;
  id_nin?: InputMaybe<Array<Scalars['ID']['input']>>;
  id_notnull?: InputMaybe<Scalars['ID']['input']>;
  id_null?: InputMaybe<Scalars['ID']['input']>;
  name?: InputMaybe<Scalars['String']['input']>;
  name_ilike?: InputMaybe<Scalars['String']['input']>;
  name_in?: InputMaybe<Array<Scalars['String']['input']>>;
  name_like?: InputMaybe<Scalars['String']['input']>;
  name_ne?: InputMaybe<Scalars['String']['input']>;
  name_nin?: InputMaybe<Array<Scalars['String']['input']>>;
  name_notnull?: InputMaybe<Scalars['String']['input']>;
  name_null?: InputMaybe<Scalars['String']['input']>;
  tasks?: InputMaybe<TasksListFilter>;
};

export type TagsOrderByInput = {
  id?: InputMaybe<Sort>;
  name?: InputMaybe<Sort>;
  tasks?: InputMaybe<Sort>;
};

export type TagsPaginationInput = {
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<TagsOrderByInput>;
};

export type TagsUpdateManyInput = {
  data: Array<TagCreateOrUpdateInput>;
};

export type Task = {
  __typename?: 'Task';
  description: Scalars['String']['output'];
  id: Scalars['ID']['output'];
  priority?: Maybe<Priority>;
  tags?: Maybe<Array<Tag>>;
  user?: Maybe<User>;
};

export type TaskCreateOrUpdateInput = {
  description?: InputMaybe<Scalars['String']['input']>;
  id?: InputMaybe<Scalars['ID']['input']>;
  priority?: InputMaybe<Priority>;
  tags?: InputMaybe<Array<TagCreateOrUpdateInput>>;
  user?: InputMaybe<UserCreateOrUpdateInput>;
};

export type TaskInsertInput = {
  description: Scalars['String']['input'];
  priority?: InputMaybe<Priority>;
  tags?: InputMaybe<Array<TagCreateOrUpdateInput>>;
  user?: InputMaybe<UserCreateOrUpdateInput>;
};

export type TasksCreateOrUpdateManyInput = {
  data: Array<TaskCreateOrUpdateInput>;
};

export type TasksInsertManyInput = {
  data: Array<TaskInsertInput>;
};

export type TasksListFilter = {
  _and?: InputMaybe<Array<TasksListFilter>>;
  _not?: InputMaybe<TasksListFilter>;
  _or?: InputMaybe<Array<TasksListFilter>>;
  description?: InputMaybe<Scalars['String']['input']>;
  description_ilike?: InputMaybe<Scalars['String']['input']>;
  description_in?: InputMaybe<Array<Scalars['String']['input']>>;
  description_like?: InputMaybe<Scalars['String']['input']>;
  description_ne?: InputMaybe<Scalars['String']['input']>;
  description_nin?: InputMaybe<Array<Scalars['String']['input']>>;
  description_notnull?: InputMaybe<Scalars['String']['input']>;
  description_null?: InputMaybe<Scalars['String']['input']>;
  id?: InputMaybe<Scalars['ID']['input']>;
  id_in?: InputMaybe<Array<Scalars['ID']['input']>>;
  id_ne?: InputMaybe<Scalars['ID']['input']>;
  id_nin?: InputMaybe<Array<Scalars['ID']['input']>>;
  id_notnull?: InputMaybe<Scalars['ID']['input']>;
  id_null?: InputMaybe<Scalars['ID']['input']>;
  priority?: InputMaybe<Priority>;
  priority_in?: InputMaybe<Array<Priority>>;
  priority_ne?: InputMaybe<Priority>;
  priority_nin?: InputMaybe<Array<Priority>>;
  priority_notnull?: InputMaybe<Priority>;
  priority_null?: InputMaybe<Priority>;
  tags?: InputMaybe<TagsListFilter>;
  user?: InputMaybe<UsersListFilter>;
};

export type TasksOrderByInput = {
  description?: InputMaybe<Sort>;
  id?: InputMaybe<Sort>;
  priority?: InputMaybe<Sort>;
};

export type TasksPaginationInput = {
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<TasksOrderByInput>;
};

export type TasksUpdateManyInput = {
  data: Array<TaskCreateOrUpdateInput>;
};

export type Token = {
  __typename?: 'Token';
  authToken: Scalars['String']['output'];
};

export type User = {
  __typename?: 'User';
  id: Scalars['ID']['output'];
  name: Scalars['String']['output'];
};

export type UserCreateOrUpdateInput = {
  id?: InputMaybe<Scalars['ID']['input']>;
  name?: InputMaybe<Scalars['String']['input']>;
};

export type UserInsertInput = {
  name: Scalars['String']['input'];
};

export type UsersCreateOrUpdateManyInput = {
  data: Array<UserCreateOrUpdateInput>;
};

export type UsersInsertManyInput = {
  data: Array<UserInsertInput>;
};

export type UsersListFilter = {
  _and?: InputMaybe<Array<UsersListFilter>>;
  _not?: InputMaybe<UsersListFilter>;
  _or?: InputMaybe<Array<UsersListFilter>>;
  id?: InputMaybe<Scalars['ID']['input']>;
  id_in?: InputMaybe<Array<Scalars['ID']['input']>>;
  id_ne?: InputMaybe<Scalars['ID']['input']>;
  id_nin?: InputMaybe<Array<Scalars['ID']['input']>>;
  id_notnull?: InputMaybe<Scalars['ID']['input']>;
  id_null?: InputMaybe<Scalars['ID']['input']>;
  name?: InputMaybe<Scalars['String']['input']>;
  name_ilike?: InputMaybe<Scalars['String']['input']>;
  name_in?: InputMaybe<Array<Scalars['String']['input']>>;
  name_like?: InputMaybe<Scalars['String']['input']>;
  name_ne?: InputMaybe<Scalars['String']['input']>;
  name_nin?: InputMaybe<Array<Scalars['String']['input']>>;
  name_notnull?: InputMaybe<Scalars['String']['input']>;
  name_null?: InputMaybe<Scalars['String']['input']>;
};

export type UsersOrderByInput = {
  id?: InputMaybe<Sort>;
  name?: InputMaybe<Sort>;
};

export type UsersPaginationInput = {
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<UsersOrderByInput>;
};

export type UsersUpdateManyInput = {
  data: Array<UserCreateOrUpdateInput>;
};

export type TaskQueryVariables = Exact<{ [key: string]: never; }>;


export type TaskQuery = { __typename?: 'Query', task?: { __typename?: 'Task', id: string, description: string, user?: { __typename?: 'User', id: string, name: string } | null } | null };


export const TaskDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"Task"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"task"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"StringValue","value":"2","block":false}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"user"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}}]}}]}}]} as unknown as DocumentNode<TaskQuery, TaskQueryVariables>;