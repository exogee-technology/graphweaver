/* eslint-disable */
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
  /** The `JSON` scalar type represents JSON values as specified by [ECMA-404](http://www.ecma-international.org/publications/files/ECMA-ST/ECMA-404.pdf). */
  JSON: { input: any; output: any; }
};

export type AdminUiEntityAttributeMetadata = {
  __typename?: 'AdminUiEntityAttributeMetadata';
  exportPageSize?: Maybe<Scalars['Float']['output']>;
  isReadOnly?: Maybe<Scalars['Boolean']['output']>;
};

export type AdminUiEntityMetadata = {
  __typename?: 'AdminUiEntityMetadata';
  attributes: AdminUiEntityAttributeMetadata;
  backendId?: Maybe<Scalars['String']['output']>;
  defaultFilter?: Maybe<Scalars['JSON']['output']>;
  fields: Array<AdminUiFieldMetadata>;
  name: Scalars['String']['output'];
  plural: Scalars['String']['output'];
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
  extensions?: Maybe<AdminUiFieldExtensionsMetadata>;
  filter?: Maybe<AdminUiFilterMetadata>;
  isArray?: Maybe<Scalars['Boolean']['output']>;
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
  Boolean = 'BOOLEAN',
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

export type ApiKey = {
  __typename?: 'ApiKey';
  id: Scalars['ID']['output'];
  key: Scalars['String']['output'];
  revoked?: Maybe<Scalars['Boolean']['output']>;
  roles?: Maybe<Array<Roles>>;
};

export type ApiKeyCreateOrUpdateInput = {
  id: Scalars['ID']['input'];
  key?: InputMaybe<Scalars['String']['input']>;
  revoked?: InputMaybe<Scalars['Boolean']['input']>;
  roles?: InputMaybe<Array<Scalars['String']['input']>>;
  secret?: InputMaybe<Scalars['String']['input']>;
};

export type ApiKeyInsertInput = {
  key: Scalars['String']['input'];
  revoked?: InputMaybe<Scalars['Boolean']['input']>;
  roles?: InputMaybe<Array<Scalars['String']['input']>>;
  secret: Scalars['String']['input'];
};

export type ApiKeysListFilter = {
  _and?: InputMaybe<Array<ApiKeysListFilter>>;
  _not?: InputMaybe<ApiKeysListFilter>;
  _or?: InputMaybe<Array<ApiKeysListFilter>>;
  id?: InputMaybe<Scalars['ID']['input']>;
  id_in?: InputMaybe<Array<Scalars['ID']['input']>>;
  id_ne?: InputMaybe<Scalars['ID']['input']>;
  id_nin?: InputMaybe<Array<Scalars['ID']['input']>>;
  id_notnull?: InputMaybe<Scalars['ID']['input']>;
  id_null?: InputMaybe<Scalars['ID']['input']>;
  key?: InputMaybe<Scalars['String']['input']>;
  key_ilike?: InputMaybe<Scalars['String']['input']>;
  key_in?: InputMaybe<Array<Scalars['String']['input']>>;
  key_like?: InputMaybe<Scalars['String']['input']>;
  key_ne?: InputMaybe<Scalars['String']['input']>;
  key_nin?: InputMaybe<Array<Scalars['String']['input']>>;
  key_notnull?: InputMaybe<Scalars['String']['input']>;
  key_null?: InputMaybe<Scalars['String']['input']>;
  revoked?: InputMaybe<Scalars['Boolean']['input']>;
  roles?: InputMaybe<Roles>;
  roles_in?: InputMaybe<Array<Roles>>;
  roles_ne?: InputMaybe<Roles>;
  roles_nin?: InputMaybe<Array<Roles>>;
  roles_notnull?: InputMaybe<Roles>;
  roles_null?: InputMaybe<Roles>;
};

export type ApiKeysOrderByInput = {
  id?: InputMaybe<Sort>;
  key?: InputMaybe<Sort>;
  roles?: InputMaybe<Sort>;
};

export type ApiKeysPaginationInput = {
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<ApiKeysOrderByInput>;
};

export type Credential = {
  __typename?: 'Credential';
  id: Scalars['ID']['output'];
  username: Scalars['String']['output'];
};

export type CredentialCreateOrUpdateInput = {
  confirm?: InputMaybe<Scalars['String']['input']>;
  id: Scalars['ID']['input'];
  password?: InputMaybe<Scalars['String']['input']>;
  username?: InputMaybe<Scalars['String']['input']>;
};

export type CredentialInsertInput = {
  confirm: Scalars['String']['input'];
  password: Scalars['String']['input'];
  username: Scalars['String']['input'];
};

export type CredentialsListFilter = {
  _and?: InputMaybe<Array<CredentialsListFilter>>;
  _not?: InputMaybe<CredentialsListFilter>;
  _or?: InputMaybe<Array<CredentialsListFilter>>;
  id?: InputMaybe<Scalars['ID']['input']>;
  id_in?: InputMaybe<Array<Scalars['ID']['input']>>;
  id_ne?: InputMaybe<Scalars['ID']['input']>;
  id_nin?: InputMaybe<Array<Scalars['ID']['input']>>;
  id_notnull?: InputMaybe<Scalars['ID']['input']>;
  id_null?: InputMaybe<Scalars['ID']['input']>;
  username?: InputMaybe<Scalars['String']['input']>;
  username_ilike?: InputMaybe<Scalars['String']['input']>;
  username_in?: InputMaybe<Array<Scalars['String']['input']>>;
  username_like?: InputMaybe<Scalars['String']['input']>;
  username_ne?: InputMaybe<Scalars['String']['input']>;
  username_nin?: InputMaybe<Array<Scalars['String']['input']>>;
  username_notnull?: InputMaybe<Scalars['String']['input']>;
  username_null?: InputMaybe<Scalars['String']['input']>;
};

export type CredentialsOrderByInput = {
  id?: InputMaybe<Sort>;
  username?: InputMaybe<Sort>;
};

export type CredentialsPaginationInput = {
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<CredentialsOrderByInput>;
};

export type Mutation = {
  __typename?: 'Mutation';
  challengePassword: Token;
  createApiKey: ApiKey;
  createCredential: Credential;
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
  deleteTags: Scalars['Boolean']['output'];
  deleteTask: Scalars['Boolean']['output'];
  deleteTasks: Scalars['Boolean']['output'];
  deleteUser: Scalars['Boolean']['output'];
  deleteUsers: Scalars['Boolean']['output'];
  enrolWallet: Scalars['Boolean']['output'];
  loginPassword: Token;
  passkeyGenerateAuthenticationOptions: Scalars['JSON']['output'];
  passkeyGenerateRegistrationOptions: Scalars['JSON']['output'];
  passkeyVerifyAuthenticationResponse: Token;
  passkeyVerifyRegistrationResponse: Scalars['Boolean']['output'];
  resetPassword: Scalars['Boolean']['output'];
  sendChallengeMagicLink: Scalars['Boolean']['output'];
  sendLoginMagicLink: Scalars['Boolean']['output'];
  sendOTPChallenge: Scalars['Boolean']['output'];
  sendResetPasswordLink: Scalars['Boolean']['output'];
  updateApiKey: ApiKey;
  updateCredential: Credential;
  updateTag: Tag;
  updateTags: Array<Tag>;
  updateTask: Task;
  updateTasks: Array<Task>;
  updateUser: User;
  updateUsers: Array<User>;
  verifyChallengeMagicLink: Token;
  verifyLoginMagicLink: Token;
  verifyOTPChallenge: Token;
  verifyWeb3Challenge: Token;
};


export type MutationChallengePasswordArgs = {
  password: Scalars['String']['input'];
};


export type MutationCreateApiKeyArgs = {
  data: ApiKeyInsertInput;
};


export type MutationCreateCredentialArgs = {
  data: CredentialInsertInput;
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
  filter: TagDeleteInput;
};


export type MutationDeleteTagsArgs = {
  filter: TagDeleteManyInput;
};


export type MutationDeleteTaskArgs = {
  filter: TaskDeleteInput;
};


export type MutationDeleteTasksArgs = {
  filter: TaskDeleteManyInput;
};


export type MutationDeleteUserArgs = {
  filter: UserDeleteInput;
};


export type MutationDeleteUsersArgs = {
  filter: UserDeleteManyInput;
};


export type MutationEnrolWalletArgs = {
  token: Scalars['String']['input'];
};


export type MutationLoginPasswordArgs = {
  password: Scalars['String']['input'];
  username: Scalars['String']['input'];
};


export type MutationPasskeyVerifyAuthenticationResponseArgs = {
  authenticationResponse: PasskeyAuthenticationResponse;
};


export type MutationPasskeyVerifyRegistrationResponseArgs = {
  registrationResponse: PasskeyRegistrationResponse;
};


export type MutationResetPasswordArgs = {
  password: Scalars['String']['input'];
  token: Scalars['String']['input'];
};


export type MutationSendLoginMagicLinkArgs = {
  username: Scalars['String']['input'];
};


export type MutationSendResetPasswordLinkArgs = {
  username: Scalars['String']['input'];
};


export type MutationUpdateApiKeyArgs = {
  data: ApiKeyCreateOrUpdateInput;
};


export type MutationUpdateCredentialArgs = {
  data: CredentialCreateOrUpdateInput;
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


export type MutationVerifyChallengeMagicLinkArgs = {
  token: Scalars['String']['input'];
};


export type MutationVerifyLoginMagicLinkArgs = {
  token: Scalars['String']['input'];
  username: Scalars['String']['input'];
};


export type MutationVerifyOtpChallengeArgs = {
  code: Scalars['String']['input'];
};


export type MutationVerifyWeb3ChallengeArgs = {
  token: Scalars['String']['input'];
};

export type PasskeyAuthenticationResponse = {
  authenticatorAttachment?: InputMaybe<Scalars['String']['input']>;
  clientExtensionResults: Scalars['JSON']['input'];
  id: Scalars['ID']['input'];
  rawId: Scalars['String']['input'];
  response: Scalars['JSON']['input'];
  type: Scalars['String']['input'];
};

export type PasskeyRegistrationResponse = {
  authenticatorAttachment?: InputMaybe<Scalars['String']['input']>;
  clientExtensionResults: Scalars['JSON']['input'];
  id: Scalars['ID']['input'];
  rawId: Scalars['String']['input'];
  response: Scalars['JSON']['input'];
  type: Scalars['String']['input'];
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
  apiKey?: Maybe<ApiKey>;
  apiKeys: Array<ApiKey>;
  canEnrolWallet: Scalars['Boolean']['output'];
  credential?: Maybe<Credential>;
  credentials: Array<Credential>;
  tag?: Maybe<Tag>;
  tags: Array<Tag>;
  task?: Maybe<Task>;
  tasks: Array<Task>;
  user?: Maybe<User>;
  users: Array<User>;
};


export type QueryApiKeyArgs = {
  id: Scalars['ID']['input'];
};


export type QueryApiKeysArgs = {
  filter?: InputMaybe<ApiKeysListFilter>;
  pagination?: InputMaybe<ApiKeysPaginationInput>;
};


export type QueryCredentialArgs = {
  id: Scalars['ID']['input'];
};


export type QueryCredentialsArgs = {
  filter?: InputMaybe<CredentialsListFilter>;
  pagination?: InputMaybe<CredentialsPaginationInput>;
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

export enum Roles {
  DarkSide = 'DARK_SIDE',
  LightSide = 'LIGHT_SIDE'
}

export enum Sort {
  Asc = 'ASC',
  Desc = 'DESC'
}

export type Tag = {
  __typename?: 'Tag';
  id: Scalars['ID']['output'];
  name: Scalars['String']['output'];
  tasks: Array<Task>;
};


export type TagTasksArgs = {
  filter?: InputMaybe<TasksListFilter>;
};

export type TagCreateOrUpdateInput = {
  id?: InputMaybe<Scalars['ID']['input']>;
  name?: InputMaybe<Scalars['String']['input']>;
  tasks?: InputMaybe<Array<TaskCreateOrUpdateInput>>;
};

export type TagDeleteInput = {
  id: Scalars['ID']['input'];
};

export type TagDeleteManyInput = {
  filter?: InputMaybe<TagsFilterInput>;
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
  tasks?: InputMaybe<TasksFilterInput>;
};

export type TagInsertInput = {
  name: Scalars['String']['input'];
  tasks?: InputMaybe<Array<TaskCreateOrUpdateInput>>;
};

export type TagsCreateOrUpdateManyInput = {
  data: Array<TagCreateOrUpdateInput>;
};

export type TagsFilterInput = {
  filter?: InputMaybe<TagsFilterInput>;
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
  tasks?: InputMaybe<TasksFilterInput>;
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
  isCompleted: Scalars['Boolean']['output'];
  priority?: Maybe<Priority>;
  slug?: Maybe<Scalars['String']['output']>;
  tags: Array<Tag>;
  user: User;
};


export type TaskTagsArgs = {
  filter?: InputMaybe<TagsListFilter>;
};

export type TaskCreateOrUpdateInput = {
  description?: InputMaybe<Scalars['String']['input']>;
  id?: InputMaybe<Scalars['ID']['input']>;
  isCompleted?: InputMaybe<Scalars['Boolean']['input']>;
  priority?: InputMaybe<Priority>;
  slug?: InputMaybe<Scalars['String']['input']>;
  tags?: InputMaybe<Array<TagCreateOrUpdateInput>>;
  user?: InputMaybe<UserCreateOrUpdateInput>;
};

export type TaskDeleteInput = {
  id: Scalars['ID']['input'];
};

export type TaskDeleteManyInput = {
  description?: InputMaybe<Scalars['String']['input']>;
  description_ilike?: InputMaybe<Scalars['String']['input']>;
  description_in?: InputMaybe<Array<Scalars['String']['input']>>;
  description_like?: InputMaybe<Scalars['String']['input']>;
  description_ne?: InputMaybe<Scalars['String']['input']>;
  description_nin?: InputMaybe<Array<Scalars['String']['input']>>;
  description_notnull?: InputMaybe<Scalars['String']['input']>;
  description_null?: InputMaybe<Scalars['String']['input']>;
  filter?: InputMaybe<TasksFilterInput>;
  id?: InputMaybe<Scalars['ID']['input']>;
  id_in?: InputMaybe<Array<Scalars['ID']['input']>>;
  id_ne?: InputMaybe<Scalars['ID']['input']>;
  id_nin?: InputMaybe<Array<Scalars['ID']['input']>>;
  id_notnull?: InputMaybe<Scalars['ID']['input']>;
  id_null?: InputMaybe<Scalars['ID']['input']>;
  isCompleted?: InputMaybe<Scalars['Boolean']['input']>;
  priority?: InputMaybe<Priority>;
  priority_in?: InputMaybe<Array<Priority>>;
  priority_ne?: InputMaybe<Priority>;
  priority_nin?: InputMaybe<Array<Priority>>;
  priority_notnull?: InputMaybe<Priority>;
  priority_null?: InputMaybe<Priority>;
  slug?: InputMaybe<Scalars['String']['input']>;
  slug_ilike?: InputMaybe<Scalars['String']['input']>;
  slug_in?: InputMaybe<Array<Scalars['String']['input']>>;
  slug_like?: InputMaybe<Scalars['String']['input']>;
  slug_ne?: InputMaybe<Scalars['String']['input']>;
  slug_nin?: InputMaybe<Array<Scalars['String']['input']>>;
  slug_notnull?: InputMaybe<Scalars['String']['input']>;
  slug_null?: InputMaybe<Scalars['String']['input']>;
  tags?: InputMaybe<TagsFilterInput>;
  user?: InputMaybe<UsersFilterInput>;
};

export type TaskInsertInput = {
  description: Scalars['String']['input'];
  isCompleted?: InputMaybe<Scalars['Boolean']['input']>;
  priority?: InputMaybe<Priority>;
  slug?: InputMaybe<Scalars['String']['input']>;
  tags?: InputMaybe<Array<TagCreateOrUpdateInput>>;
  user?: InputMaybe<UserCreateOrUpdateInput>;
};

export type TasksCreateOrUpdateManyInput = {
  data: Array<TaskCreateOrUpdateInput>;
};

export type TasksFilterInput = {
  description?: InputMaybe<Scalars['String']['input']>;
  description_ilike?: InputMaybe<Scalars['String']['input']>;
  description_in?: InputMaybe<Array<Scalars['String']['input']>>;
  description_like?: InputMaybe<Scalars['String']['input']>;
  description_ne?: InputMaybe<Scalars['String']['input']>;
  description_nin?: InputMaybe<Array<Scalars['String']['input']>>;
  description_notnull?: InputMaybe<Scalars['String']['input']>;
  description_null?: InputMaybe<Scalars['String']['input']>;
  filter?: InputMaybe<TasksFilterInput>;
  id?: InputMaybe<Scalars['ID']['input']>;
  id_in?: InputMaybe<Array<Scalars['ID']['input']>>;
  id_ne?: InputMaybe<Scalars['ID']['input']>;
  id_nin?: InputMaybe<Array<Scalars['ID']['input']>>;
  id_notnull?: InputMaybe<Scalars['ID']['input']>;
  id_null?: InputMaybe<Scalars['ID']['input']>;
  isCompleted?: InputMaybe<Scalars['Boolean']['input']>;
  priority?: InputMaybe<Priority>;
  priority_in?: InputMaybe<Array<Priority>>;
  priority_ne?: InputMaybe<Priority>;
  priority_nin?: InputMaybe<Array<Priority>>;
  priority_notnull?: InputMaybe<Priority>;
  priority_null?: InputMaybe<Priority>;
  slug?: InputMaybe<Scalars['String']['input']>;
  slug_ilike?: InputMaybe<Scalars['String']['input']>;
  slug_in?: InputMaybe<Array<Scalars['String']['input']>>;
  slug_like?: InputMaybe<Scalars['String']['input']>;
  slug_ne?: InputMaybe<Scalars['String']['input']>;
  slug_nin?: InputMaybe<Array<Scalars['String']['input']>>;
  slug_notnull?: InputMaybe<Scalars['String']['input']>;
  slug_null?: InputMaybe<Scalars['String']['input']>;
  tags?: InputMaybe<TagsFilterInput>;
  user?: InputMaybe<UsersFilterInput>;
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
  isCompleted?: InputMaybe<Scalars['Boolean']['input']>;
  priority?: InputMaybe<Priority>;
  priority_in?: InputMaybe<Array<Priority>>;
  priority_ne?: InputMaybe<Priority>;
  priority_nin?: InputMaybe<Array<Priority>>;
  priority_notnull?: InputMaybe<Priority>;
  priority_null?: InputMaybe<Priority>;
  slug?: InputMaybe<Scalars['String']['input']>;
  slug_ilike?: InputMaybe<Scalars['String']['input']>;
  slug_in?: InputMaybe<Array<Scalars['String']['input']>>;
  slug_like?: InputMaybe<Scalars['String']['input']>;
  slug_ne?: InputMaybe<Scalars['String']['input']>;
  slug_nin?: InputMaybe<Array<Scalars['String']['input']>>;
  slug_notnull?: InputMaybe<Scalars['String']['input']>;
  slug_null?: InputMaybe<Scalars['String']['input']>;
  tags?: InputMaybe<TagsListFilter>;
  user?: InputMaybe<UsersListFilter>;
};

export type TasksOrderByInput = {
  description?: InputMaybe<Sort>;
  id?: InputMaybe<Sort>;
  priority?: InputMaybe<Sort>;
  slug?: InputMaybe<Sort>;
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

export type UserDeleteInput = {
  id: Scalars['ID']['input'];
};

export type UserDeleteManyInput = {
  filter?: InputMaybe<UsersFilterInput>;
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

export type UserInsertInput = {
  name: Scalars['String']['input'];
};

export type UsersCreateOrUpdateManyInput = {
  data: Array<UserCreateOrUpdateInput>;
};

export type UsersFilterInput = {
  filter?: InputMaybe<UsersFilterInput>;
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
