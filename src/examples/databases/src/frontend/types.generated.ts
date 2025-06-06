/* 
* This file is auto-generated by Graphweaver. 
* Please do not edit it directly.
*/
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
  /** The `BigInt` scalar type represents non-fractional signed whole numeric values. */
  BigInt: { input: any; output: any; }
  /** The concept of a date without a time and/or timezone, e.g. My birthday is January 1st, 1864 regardless of timezone. */
  DateScalar: { input: any; output: any; }
  /** Returns a string in simplified extended ISO format (ISO 8601), which is always 24 or 27 characters long (YYYY-MM-DDTHH:mm:ss.sssZ or ±YYYYYY-MM-DDTHH:mm:ss.sssZ, respectively). The timezone is always zero UTC offset, as denoted by the suffix "Z". */
  ISOString: { input: any; output: any; }
  /** The `JSON` scalar type represents JSON values as specified by [ECMA-404](http://www.ecma-international.org/publications/files/ECMA-ST/ECMA-404.pdf). */
  JSON: { input: any; output: any; }
};

export type AdminUiEntityAttributeMetadata = {
  __typename?: 'AdminUiEntityAttributeMetadata';
  clientGeneratedPrimaryKeys?: Maybe<Scalars['Boolean']['output']>;
  exportPageSize?: Maybe<Scalars['Float']['output']>;
  isReadOnly?: Maybe<Scalars['Boolean']['output']>;
};

export type AdminUiEntityMetadata = {
  __typename?: 'AdminUiEntityMetadata';
  attributes: AdminUiEntityAttributeMetadata;
  backendDisplayName?: Maybe<Scalars['String']['output']>;
  backendId?: Maybe<Scalars['String']['output']>;
  defaultFilter?: Maybe<Scalars['JSON']['output']>;
  defaultSort?: Maybe<Scalars['JSON']['output']>;
  excludeFromTracing: Scalars['Boolean']['output'];
  fieldForDetailPanelNavigationId: Scalars['String']['output'];
  fields: Array<AdminUiFieldMetadata>;
  hideInSideBar: Scalars['Boolean']['output'];
  name: Scalars['String']['output'];
  plural: Scalars['String']['output'];
  primaryKeyField: Scalars['String']['output'];
  summaryField?: Maybe<Scalars['String']['output']>;
  supportedAggregationTypes: Array<AggregationType>;
  supportsPseudoCursorPagination: Scalars['Boolean']['output'];
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

export type AdminUiFieldAttributeMetadata = {
  __typename?: 'AdminUiFieldAttributeMetadata';
  isReadOnly: Scalars['Boolean']['output'];
  isRequired: Scalars['Boolean']['output'];
};

export type AdminUiFieldExtensionsMetadata = {
  __typename?: 'AdminUiFieldExtensionsMetadata';
  key?: Maybe<Scalars['String']['output']>;
};

export type AdminUiFieldMetadata = {
  __typename?: 'AdminUiFieldMetadata';
  attributes?: Maybe<AdminUiFieldAttributeMetadata>;
  detailPanelInputComponent?: Maybe<DetailPanelInputComponent>;
  extensions?: Maybe<AdminUiFieldExtensionsMetadata>;
  filter?: Maybe<AdminUiFilterMetadata>;
  hideInDetailForm?: Maybe<Scalars['Boolean']['output']>;
  hideInFilterBar?: Maybe<Scalars['Boolean']['output']>;
  hideInTable?: Maybe<Scalars['Boolean']['output']>;
  isArray?: Maybe<Scalars['Boolean']['output']>;
  name: Scalars['String']['output'];
  relatedEntity?: Maybe<Scalars['String']['output']>;
  relationshipType?: Maybe<Scalars['String']['output']>;
  type: Scalars['String']['output'];
};

export type AdminUiFilterMetadata = {
  __typename?: 'AdminUiFilterMetadata';
  options?: Maybe<Scalars['JSON']['output']>;
  type: AdminUiFilterType;
};

export enum AdminUiFilterType {
  Boolean = 'BOOLEAN',
  DateRange = 'DATE_RANGE',
  DateTimeRange = 'DATE_TIME_RANGE',
  DropDownText = 'DROP_DOWN_TEXT',
  Enum = 'ENUM',
  Numeric = 'NUMERIC',
  NumericRange = 'NUMERIC_RANGE',
  Relationship = 'RELATIONSHIP',
  Text = 'TEXT'
}

export type AdminUiMetadata = {
  __typename?: 'AdminUiMetadata';
  entities: Array<AdminUiEntityMetadata>;
  enums: Array<AdminUiEnumMetadata>;
};

export type AggregationResult = {
  __typename?: 'AggregationResult';
  count: Scalars['Int']['output'];
};

export enum AggregationType {
  Count = 'COUNT'
}

export type DeleteOneFilterInput = {
  id: Scalars['ID']['input'];
};

export type DetailPanelInputComponent = {
  __typename?: 'DetailPanelInputComponent';
  name: DetailPanelInputComponentOption;
  options?: Maybe<Scalars['JSON']['output']>;
};

export enum DetailPanelInputComponentOption {
  Markdown = 'MARKDOWN',
  RichText = 'RICH_TEXT',
  Text = 'TEXT'
}

export type Mutation = {
  __typename?: 'Mutation';
  /** Create or update many Tasks. */
  createOrUpdateTasks?: Maybe<Array<Maybe<Task>>>;
  /** Create or update many Users. */
  createOrUpdateUsers?: Maybe<Array<Maybe<User>>>;
  /** Create a single Task. */
  createTask?: Maybe<Task>;
  /** Create many Tasks. */
  createTasks?: Maybe<Array<Maybe<Task>>>;
  /** Create a single User. */
  createUser?: Maybe<User>;
  /** Create many Users. */
  createUsers?: Maybe<Array<Maybe<User>>>;
  /** Delete a single Task. */
  deleteTask?: Maybe<Scalars['Boolean']['output']>;
  /** Delete many Tasks with a filter. */
  deleteTasks?: Maybe<Scalars['Boolean']['output']>;
  /** Delete a single User. */
  deleteUser?: Maybe<Scalars['Boolean']['output']>;
  /** Delete many Users with a filter. */
  deleteUsers?: Maybe<Scalars['Boolean']['output']>;
  /** Update a single Task. */
  updateTask?: Maybe<Task>;
  /** Update many Tasks. */
  updateTasks?: Maybe<Array<Maybe<Task>>>;
  /** Update a single User. */
  updateUser?: Maybe<User>;
  /** Update many Users. */
  updateUsers?: Maybe<Array<Maybe<User>>>;
};


export type MutationCreateOrUpdateTasksArgs = {
  input: Array<TaskCreateOrUpdateInput>;
};


export type MutationCreateOrUpdateUsersArgs = {
  input: Array<UserCreateOrUpdateInput>;
};


export type MutationCreateTaskArgs = {
  input: TaskInsertInput;
};


export type MutationCreateTasksArgs = {
  input: Array<TaskInsertInput>;
};


export type MutationCreateUserArgs = {
  input: UserInsertInput;
};


export type MutationCreateUsersArgs = {
  input: Array<UserInsertInput>;
};


export type MutationDeleteTaskArgs = {
  filter: DeleteOneFilterInput;
};


export type MutationDeleteTasksArgs = {
  filter: TasksListFilter;
};


export type MutationDeleteUserArgs = {
  filter: DeleteOneFilterInput;
};


export type MutationDeleteUsersArgs = {
  filter: UsersListFilter;
};


export type MutationUpdateTaskArgs = {
  input: TaskUpdateInput;
};


export type MutationUpdateTasksArgs = {
  input: Array<TaskUpdateInput>;
};


export type MutationUpdateUserArgs = {
  input: UserUpdateInput;
};


export type MutationUpdateUsersArgs = {
  input: Array<UserUpdateInput>;
};

export type Query = {
  __typename?: 'Query';
  /** Query used by the Admin UI to introspect the schema and metadata. */
  _graphweaver?: Maybe<AdminUiMetadata>;
  /** Get a single Task. */
  task?: Maybe<Task>;
  /** Get multiple Tasks. */
  tasks?: Maybe<Array<Maybe<Task>>>;
  /** Get aggregated data for Tasks. */
  tasks_aggregate?: Maybe<AggregationResult>;
  /** Get a single User. */
  user?: Maybe<User>;
  /** Get multiple Users. */
  users?: Maybe<Array<Maybe<User>>>;
  /** Get aggregated data for Users. */
  users_aggregate?: Maybe<AggregationResult>;
};


export type QueryTaskArgs = {
  id: Scalars['ID']['input'];
};


export type QueryTasksArgs = {
  filter?: InputMaybe<TasksListFilter>;
  pagination?: InputMaybe<TasksPaginationInput>;
};


export type QueryTasks_AggregateArgs = {
  filter?: InputMaybe<TasksListFilter>;
};


export type QueryUserArgs = {
  id: Scalars['ID']['input'];
};


export type QueryUsersArgs = {
  filter?: InputMaybe<UsersListFilter>;
  pagination?: InputMaybe<UsersPaginationInput>;
};


export type QueryUsers_AggregateArgs = {
  filter?: InputMaybe<UsersListFilter>;
};

export enum Sort {
  Asc = 'ASC',
  Desc = 'DESC'
}

export type Task = {
  __typename?: 'Task';
  createdAt: Scalars['ISOString']['output'];
  description: Scalars['String']['output'];
  dueAt?: Maybe<Scalars['DateScalar']['output']>;
  id: Scalars['BigInt']['output'];
  isCompleted: Scalars['Boolean']['output'];
  meta?: Maybe<Scalars['JSON']['output']>;
  updatedAt: Scalars['ISOString']['output'];
  user: User;
  user_aggregate?: Maybe<AggregationResult>;
};


export type TaskUserArgs = {
  filter?: InputMaybe<UsersListFilter>;
};


export type TaskUser_AggregateArgs = {
  filter?: InputMaybe<UsersListFilter>;
};

/** Data needed to create or update Tasks. If an ID is passed, this is an update, otherwise it's an insert. */
export type TaskCreateOrUpdateInput = {
  createdAt?: InputMaybe<Scalars['ISOString']['input']>;
  description?: InputMaybe<Scalars['String']['input']>;
  dueAt?: InputMaybe<Scalars['DateScalar']['input']>;
  id?: InputMaybe<Scalars['ID']['input']>;
  isCompleted?: InputMaybe<Scalars['Boolean']['input']>;
  meta?: InputMaybe<Scalars['JSON']['input']>;
  updatedAt?: InputMaybe<Scalars['ISOString']['input']>;
  user?: InputMaybe<UserCreateOrUpdateInput>;
};

/** Data needed to create Tasks. */
export type TaskInsertInput = {
  createdAt: Scalars['ISOString']['input'];
  description: Scalars['String']['input'];
  dueAt?: InputMaybe<Scalars['DateScalar']['input']>;
  isCompleted: Scalars['Boolean']['input'];
  meta?: InputMaybe<Scalars['JSON']['input']>;
  updatedAt: Scalars['ISOString']['input'];
  user?: InputMaybe<UserCreateOrUpdateInput>;
};

/** Data needed to update Tasks. An ID must be passed. */
export type TaskUpdateInput = {
  createdAt?: InputMaybe<Scalars['ISOString']['input']>;
  description?: InputMaybe<Scalars['String']['input']>;
  dueAt?: InputMaybe<Scalars['DateScalar']['input']>;
  id: Scalars['ID']['input'];
  isCompleted?: InputMaybe<Scalars['Boolean']['input']>;
  meta?: InputMaybe<Scalars['JSON']['input']>;
  updatedAt?: InputMaybe<Scalars['ISOString']['input']>;
  user?: InputMaybe<UserCreateOrUpdateInput>;
};

export type TasksListFilter = {
  _and?: InputMaybe<Array<InputMaybe<TasksListFilter>>>;
  _not?: InputMaybe<TasksListFilter>;
  _or?: InputMaybe<Array<InputMaybe<TasksListFilter>>>;
  createdAt?: InputMaybe<Scalars['ISOString']['input']>;
  createdAt_gt?: InputMaybe<Scalars['ISOString']['input']>;
  createdAt_gte?: InputMaybe<Scalars['ISOString']['input']>;
  createdAt_in?: InputMaybe<Array<Scalars['ISOString']['input']>>;
  createdAt_lt?: InputMaybe<Scalars['ISOString']['input']>;
  createdAt_lte?: InputMaybe<Scalars['ISOString']['input']>;
  createdAt_ne?: InputMaybe<Scalars['ISOString']['input']>;
  createdAt_nin?: InputMaybe<Array<Scalars['ISOString']['input']>>;
  createdAt_notnull?: InputMaybe<Scalars['Boolean']['input']>;
  createdAt_null?: InputMaybe<Scalars['Boolean']['input']>;
  description?: InputMaybe<Scalars['String']['input']>;
  description_gt?: InputMaybe<Scalars['String']['input']>;
  description_gte?: InputMaybe<Scalars['String']['input']>;
  description_ilike?: InputMaybe<Scalars['String']['input']>;
  description_in?: InputMaybe<Array<Scalars['String']['input']>>;
  description_like?: InputMaybe<Scalars['String']['input']>;
  description_lt?: InputMaybe<Scalars['String']['input']>;
  description_lte?: InputMaybe<Scalars['String']['input']>;
  description_ne?: InputMaybe<Scalars['String']['input']>;
  description_nin?: InputMaybe<Array<Scalars['String']['input']>>;
  description_notnull?: InputMaybe<Scalars['Boolean']['input']>;
  description_null?: InputMaybe<Scalars['Boolean']['input']>;
  dueAt?: InputMaybe<Scalars['DateScalar']['input']>;
  dueAt_gt?: InputMaybe<Scalars['DateScalar']['input']>;
  dueAt_gte?: InputMaybe<Scalars['DateScalar']['input']>;
  dueAt_in?: InputMaybe<Array<Scalars['DateScalar']['input']>>;
  dueAt_lt?: InputMaybe<Scalars['DateScalar']['input']>;
  dueAt_lte?: InputMaybe<Scalars['DateScalar']['input']>;
  dueAt_ne?: InputMaybe<Scalars['DateScalar']['input']>;
  dueAt_nin?: InputMaybe<Array<Scalars['DateScalar']['input']>>;
  dueAt_notnull?: InputMaybe<Scalars['Boolean']['input']>;
  dueAt_null?: InputMaybe<Scalars['Boolean']['input']>;
  id?: InputMaybe<Scalars['BigInt']['input']>;
  id_in?: InputMaybe<Array<Scalars['BigInt']['input']>>;
  id_ne?: InputMaybe<Scalars['BigInt']['input']>;
  id_nin?: InputMaybe<Array<Scalars['BigInt']['input']>>;
  id_notnull?: InputMaybe<Scalars['Boolean']['input']>;
  id_null?: InputMaybe<Scalars['Boolean']['input']>;
  isCompleted?: InputMaybe<Scalars['Boolean']['input']>;
  isCompleted_in?: InputMaybe<Array<Scalars['Boolean']['input']>>;
  isCompleted_ne?: InputMaybe<Scalars['Boolean']['input']>;
  isCompleted_nin?: InputMaybe<Array<Scalars['Boolean']['input']>>;
  isCompleted_notnull?: InputMaybe<Scalars['Boolean']['input']>;
  isCompleted_null?: InputMaybe<Scalars['Boolean']['input']>;
  meta?: InputMaybe<Scalars['JSON']['input']>;
  meta_in?: InputMaybe<Array<Scalars['JSON']['input']>>;
  meta_ne?: InputMaybe<Scalars['JSON']['input']>;
  meta_nin?: InputMaybe<Array<Scalars['JSON']['input']>>;
  meta_notnull?: InputMaybe<Scalars['Boolean']['input']>;
  meta_null?: InputMaybe<Scalars['Boolean']['input']>;
  updatedAt?: InputMaybe<Scalars['ISOString']['input']>;
  updatedAt_gt?: InputMaybe<Scalars['ISOString']['input']>;
  updatedAt_gte?: InputMaybe<Scalars['ISOString']['input']>;
  updatedAt_in?: InputMaybe<Array<Scalars['ISOString']['input']>>;
  updatedAt_lt?: InputMaybe<Scalars['ISOString']['input']>;
  updatedAt_lte?: InputMaybe<Scalars['ISOString']['input']>;
  updatedAt_ne?: InputMaybe<Scalars['ISOString']['input']>;
  updatedAt_nin?: InputMaybe<Array<Scalars['ISOString']['input']>>;
  updatedAt_notnull?: InputMaybe<Scalars['Boolean']['input']>;
  updatedAt_null?: InputMaybe<Scalars['Boolean']['input']>;
  user?: InputMaybe<UsersListFilter>;
};

export type TasksOrderByInput = {
  createdAt?: InputMaybe<Sort>;
  description?: InputMaybe<Sort>;
  dueAt?: InputMaybe<Sort>;
  id?: InputMaybe<Sort>;
  isCompleted?: InputMaybe<Sort>;
  meta?: InputMaybe<Sort>;
  updatedAt?: InputMaybe<Sort>;
};

/** Pagination options for Tasks. */
export type TasksPaginationInput = {
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<TasksOrderByInput>;
};

export type User = {
  __typename?: 'User';
  age?: Maybe<Scalars['Float']['output']>;
  email: Scalars['String']['output'];
  id: Scalars['ID']['output'];
  notes?: Maybe<Scalars['String']['output']>;
  status: UserStatus;
  username: Scalars['String']['output'];
};

/** Data needed to create or update Users. If an ID is passed, this is an update, otherwise it's an insert. */
export type UserCreateOrUpdateInput = {
  age?: InputMaybe<Scalars['Float']['input']>;
  email?: InputMaybe<Scalars['String']['input']>;
  id?: InputMaybe<Scalars['ID']['input']>;
  notes?: InputMaybe<Scalars['String']['input']>;
  status?: InputMaybe<UserStatus>;
  username?: InputMaybe<Scalars['String']['input']>;
};

/** Data needed to create Users. */
export type UserInsertInput = {
  age?: InputMaybe<Scalars['Float']['input']>;
  email: Scalars['String']['input'];
  notes?: InputMaybe<Scalars['String']['input']>;
  status?: InputMaybe<UserStatus>;
  username: Scalars['String']['input'];
};

export enum UserStatus {
  Active = 'ACTIVE',
  Blocked = 'BLOCKED',
  Suspended = 'SUSPENDED'
}

/** Data needed to update Users. An ID must be passed. */
export type UserUpdateInput = {
  age?: InputMaybe<Scalars['Float']['input']>;
  email?: InputMaybe<Scalars['String']['input']>;
  id: Scalars['ID']['input'];
  notes?: InputMaybe<Scalars['String']['input']>;
  status?: InputMaybe<UserStatus>;
  username?: InputMaybe<Scalars['String']['input']>;
};

export type UsersListFilter = {
  _and?: InputMaybe<Array<InputMaybe<UsersListFilter>>>;
  _not?: InputMaybe<UsersListFilter>;
  _or?: InputMaybe<Array<InputMaybe<UsersListFilter>>>;
  age?: InputMaybe<Scalars['Float']['input']>;
  age_gt?: InputMaybe<Scalars['Float']['input']>;
  age_gte?: InputMaybe<Scalars['Float']['input']>;
  age_in?: InputMaybe<Array<Scalars['Float']['input']>>;
  age_lt?: InputMaybe<Scalars['Float']['input']>;
  age_lte?: InputMaybe<Scalars['Float']['input']>;
  age_ne?: InputMaybe<Scalars['Float']['input']>;
  age_nin?: InputMaybe<Array<Scalars['Float']['input']>>;
  age_notnull?: InputMaybe<Scalars['Boolean']['input']>;
  age_null?: InputMaybe<Scalars['Boolean']['input']>;
  email?: InputMaybe<Scalars['String']['input']>;
  email_gt?: InputMaybe<Scalars['String']['input']>;
  email_gte?: InputMaybe<Scalars['String']['input']>;
  email_ilike?: InputMaybe<Scalars['String']['input']>;
  email_in?: InputMaybe<Array<Scalars['String']['input']>>;
  email_like?: InputMaybe<Scalars['String']['input']>;
  email_lt?: InputMaybe<Scalars['String']['input']>;
  email_lte?: InputMaybe<Scalars['String']['input']>;
  email_ne?: InputMaybe<Scalars['String']['input']>;
  email_nin?: InputMaybe<Array<Scalars['String']['input']>>;
  email_notnull?: InputMaybe<Scalars['Boolean']['input']>;
  email_null?: InputMaybe<Scalars['Boolean']['input']>;
  id?: InputMaybe<Scalars['ID']['input']>;
  id_gt?: InputMaybe<Scalars['ID']['input']>;
  id_gte?: InputMaybe<Scalars['ID']['input']>;
  id_in?: InputMaybe<Array<Scalars['ID']['input']>>;
  id_lt?: InputMaybe<Scalars['ID']['input']>;
  id_lte?: InputMaybe<Scalars['ID']['input']>;
  id_ne?: InputMaybe<Scalars['ID']['input']>;
  id_nin?: InputMaybe<Array<Scalars['ID']['input']>>;
  id_notnull?: InputMaybe<Scalars['Boolean']['input']>;
  id_null?: InputMaybe<Scalars['Boolean']['input']>;
  notes?: InputMaybe<Scalars['String']['input']>;
  notes_gt?: InputMaybe<Scalars['String']['input']>;
  notes_gte?: InputMaybe<Scalars['String']['input']>;
  notes_ilike?: InputMaybe<Scalars['String']['input']>;
  notes_in?: InputMaybe<Array<Scalars['String']['input']>>;
  notes_like?: InputMaybe<Scalars['String']['input']>;
  notes_lt?: InputMaybe<Scalars['String']['input']>;
  notes_lte?: InputMaybe<Scalars['String']['input']>;
  notes_ne?: InputMaybe<Scalars['String']['input']>;
  notes_nin?: InputMaybe<Array<Scalars['String']['input']>>;
  notes_notnull?: InputMaybe<Scalars['Boolean']['input']>;
  notes_null?: InputMaybe<Scalars['Boolean']['input']>;
  status?: InputMaybe<UserStatus>;
  status_in?: InputMaybe<Array<UserStatus>>;
  status_nin?: InputMaybe<Array<UserStatus>>;
  username?: InputMaybe<Scalars['String']['input']>;
  username_gt?: InputMaybe<Scalars['String']['input']>;
  username_gte?: InputMaybe<Scalars['String']['input']>;
  username_ilike?: InputMaybe<Scalars['String']['input']>;
  username_in?: InputMaybe<Array<Scalars['String']['input']>>;
  username_like?: InputMaybe<Scalars['String']['input']>;
  username_lt?: InputMaybe<Scalars['String']['input']>;
  username_lte?: InputMaybe<Scalars['String']['input']>;
  username_ne?: InputMaybe<Scalars['String']['input']>;
  username_nin?: InputMaybe<Array<Scalars['String']['input']>>;
  username_notnull?: InputMaybe<Scalars['Boolean']['input']>;
  username_null?: InputMaybe<Scalars['Boolean']['input']>;
};

export type UsersOrderByInput = {
  age?: InputMaybe<Sort>;
  email?: InputMaybe<Sort>;
  id?: InputMaybe<Sort>;
  notes?: InputMaybe<Sort>;
  status?: InputMaybe<Sort>;
  username?: InputMaybe<Sort>;
};

/** Pagination options for Users. */
export type UsersPaginationInput = {
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<UsersOrderByInput>;
};
