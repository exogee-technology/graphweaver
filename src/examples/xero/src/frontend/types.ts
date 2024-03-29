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
  /** Returns a string in simplified extended ISO format (ISO 8601), which is always 24 or 27 characters long (YYYY-MM-DDTHH:mm:ss.sssZ or ±YYYYYY-MM-DDTHH:mm:ss.sssZ, respectively). The timezone is always zero UTC offset, as denoted by the suffix "Z". */
  ISOString: { input: any; output: any; }
};

export type Account = {
  __typename?: 'Account';
  code?: Maybe<Scalars['String']['output']>;
  id: Scalars['ID']['output'];
  name?: Maybe<Scalars['String']['output']>;
  tenant?: Maybe<Tenant>;
  tenantId: Scalars['String']['output'];
  type?: Maybe<AccountType>;
};

export type AccountCreateOrUpdateInput = {
  code?: InputMaybe<Scalars['String']['input']>;
  id?: InputMaybe<Scalars['ID']['input']>;
  name?: InputMaybe<Scalars['String']['input']>;
  tenant?: InputMaybe<TenantCreateOrUpdateInput>;
  tenantId?: InputMaybe<Scalars['String']['input']>;
  type?: InputMaybe<AccountType>;
};

export type AccountInsertInput = {
  code?: InputMaybe<Scalars['String']['input']>;
  name?: InputMaybe<Scalars['String']['input']>;
  tenant?: InputMaybe<TenantCreateOrUpdateInput>;
  tenantId: Scalars['String']['input'];
  type?: InputMaybe<AccountType>;
};

export enum AccountType {
  Bank = 'BANK',
  Current = 'CURRENT',
  Currliab = 'CURRLIAB',
  Depreciatn = 'DEPRECIATN',
  Directcosts = 'DIRECTCOSTS',
  Equity = 'EQUITY',
  Expense = 'EXPENSE',
  Fixed = 'FIXED',
  Inventory = 'INVENTORY',
  Liability = 'LIABILITY',
  Noncurrent = 'NONCURRENT',
  Otherincome = 'OTHERINCOME',
  Overheads = 'OVERHEADS',
  Payg = 'PAYG',
  Paygliability = 'PAYGLIABILITY',
  Prepayment = 'PREPAYMENT',
  Revenue = 'REVENUE',
  Sales = 'SALES',
  Superannuationexpense = 'SUPERANNUATIONEXPENSE',
  Superannuationliability = 'SUPERANNUATIONLIABILITY',
  Termliab = 'TERMLIAB',
  Wagesexpense = 'WAGESEXPENSE'
}

export type AccountsCreateOrUpdateManyInput = {
  data: Array<AccountCreateOrUpdateInput>;
};

export type AccountsInsertManyInput = {
  data: Array<AccountInsertInput>;
};

export type AccountsListFilter = {
  _and?: InputMaybe<Array<AccountsListFilter>>;
  _not?: InputMaybe<AccountsListFilter>;
  _or?: InputMaybe<Array<AccountsListFilter>>;
  code?: InputMaybe<Scalars['String']['input']>;
  code_ilike?: InputMaybe<Scalars['String']['input']>;
  code_in?: InputMaybe<Array<Scalars['String']['input']>>;
  code_like?: InputMaybe<Scalars['String']['input']>;
  code_ne?: InputMaybe<Scalars['String']['input']>;
  code_nin?: InputMaybe<Array<Scalars['String']['input']>>;
  code_notnull?: InputMaybe<Scalars['String']['input']>;
  code_null?: InputMaybe<Scalars['String']['input']>;
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
  tenant?: InputMaybe<TenantsListFilter>;
  tenantId?: InputMaybe<Scalars['String']['input']>;
  tenantId_ilike?: InputMaybe<Scalars['String']['input']>;
  tenantId_in?: InputMaybe<Array<Scalars['String']['input']>>;
  tenantId_like?: InputMaybe<Scalars['String']['input']>;
  tenantId_ne?: InputMaybe<Scalars['String']['input']>;
  tenantId_nin?: InputMaybe<Array<Scalars['String']['input']>>;
  tenantId_notnull?: InputMaybe<Scalars['String']['input']>;
  tenantId_null?: InputMaybe<Scalars['String']['input']>;
  type?: InputMaybe<AccountType>;
  type_in?: InputMaybe<Array<AccountType>>;
  type_ne?: InputMaybe<AccountType>;
  type_nin?: InputMaybe<Array<AccountType>>;
  type_notnull?: InputMaybe<AccountType>;
  type_null?: InputMaybe<AccountType>;
};

export type AccountsOrderByInput = {
  code?: InputMaybe<Sort>;
  id?: InputMaybe<Sort>;
  name?: InputMaybe<Sort>;
  tenantId?: InputMaybe<Sort>;
  type?: InputMaybe<Sort>;
};

export type AccountsPaginationInput = {
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<AccountsOrderByInput>;
};

export type AccountsUpdateManyInput = {
  data: Array<AccountCreateOrUpdateInput>;
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

export type AdminUiFieldAttributeMetadata = {
  __typename?: 'AdminUiFieldAttributeMetadata';
  isReadOnly?: Maybe<Scalars['Boolean']['output']>;
};

export type AdminUiFieldExtentionsMetadata = {
  __typename?: 'AdminUiFieldExtentionsMetadata';
  key?: Maybe<Scalars['String']['output']>;
};

export type AdminUiFieldMetadata = {
  __typename?: 'AdminUiFieldMetadata';
  attributes?: Maybe<AdminUiFieldAttributeMetadata>;
  extensions?: Maybe<AdminUiFieldExtentionsMetadata>;
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

export type Mutation = {
  __typename?: 'Mutation';
  createAccount: Account;
  createAccounts: Array<Account>;
  createOrUpdateAccounts: Array<Account>;
  createOrUpdateProfitAndLossRows: Array<ProfitAndLossRow>;
  createOrUpdateTenants: Array<Tenant>;
  createProfitAndLossRow: ProfitAndLossRow;
  createProfitAndLossRows: Array<ProfitAndLossRow>;
  createTenant: Tenant;
  createTenants: Array<Tenant>;
  deleteAccount: Scalars['Boolean']['output'];
  deleteProfitAndLossRow: Scalars['Boolean']['output'];
  deleteTenant: Scalars['Boolean']['output'];
  updateAccount: Account;
  updateAccounts: Array<Account>;
  updateProfitAndLossRow: ProfitAndLossRow;
  updateProfitAndLossRows: Array<ProfitAndLossRow>;
  updateTenant: Tenant;
  updateTenants: Array<Tenant>;
};


export type MutationCreateAccountArgs = {
  data: AccountInsertInput;
};


export type MutationCreateAccountsArgs = {
  input: AccountsInsertManyInput;
};


export type MutationCreateOrUpdateAccountsArgs = {
  input: AccountsCreateOrUpdateManyInput;
};


export type MutationCreateOrUpdateProfitAndLossRowsArgs = {
  input: ProfitAndLossRowsCreateOrUpdateManyInput;
};


export type MutationCreateOrUpdateTenantsArgs = {
  input: TenantsCreateOrUpdateManyInput;
};


export type MutationCreateProfitAndLossRowArgs = {
  data: ProfitAndLossRowInsertInput;
};


export type MutationCreateProfitAndLossRowsArgs = {
  input: ProfitAndLossRowsInsertManyInput;
};


export type MutationCreateTenantArgs = {
  data: TenantInsertInput;
};


export type MutationCreateTenantsArgs = {
  input: TenantsInsertManyInput;
};


export type MutationDeleteAccountArgs = {
  id: Scalars['ID']['input'];
};


export type MutationDeleteProfitAndLossRowArgs = {
  id: Scalars['ID']['input'];
};


export type MutationDeleteTenantArgs = {
  id: Scalars['ID']['input'];
};


export type MutationUpdateAccountArgs = {
  data: AccountCreateOrUpdateInput;
};


export type MutationUpdateAccountsArgs = {
  input: AccountsUpdateManyInput;
};


export type MutationUpdateProfitAndLossRowArgs = {
  data: ProfitAndLossRowCreateOrUpdateInput;
};


export type MutationUpdateProfitAndLossRowsArgs = {
  input: ProfitAndLossRowsUpdateManyInput;
};


export type MutationUpdateTenantArgs = {
  data: TenantCreateOrUpdateInput;
};


export type MutationUpdateTenantsArgs = {
  input: TenantsUpdateManyInput;
};

export type ProfitAndLossRow = {
  __typename?: 'ProfitAndLossRow';
  account?: Maybe<Account>;
  accountId?: Maybe<Scalars['ID']['output']>;
  amount: Scalars['Float']['output'];
  date: Scalars['ISOString']['output'];
  description: Scalars['String']['output'];
  id: Scalars['ID']['output'];
  tenant?: Maybe<Tenant>;
  tenantId?: Maybe<Scalars['ID']['output']>;
};

export type ProfitAndLossRowCreateOrUpdateInput = {
  account?: InputMaybe<AccountCreateOrUpdateInput>;
  accountId?: InputMaybe<Scalars['ID']['input']>;
  amount?: InputMaybe<Scalars['Float']['input']>;
  date?: InputMaybe<Scalars['ISOString']['input']>;
  description?: InputMaybe<Scalars['String']['input']>;
  id?: InputMaybe<Scalars['ID']['input']>;
  tenant?: InputMaybe<TenantCreateOrUpdateInput>;
  tenantId?: InputMaybe<Scalars['ID']['input']>;
};

export type ProfitAndLossRowInsertInput = {
  account?: InputMaybe<AccountCreateOrUpdateInput>;
  accountId?: InputMaybe<Scalars['ID']['input']>;
  amount: Scalars['Float']['input'];
  date?: InputMaybe<Scalars['ISOString']['input']>;
  description: Scalars['String']['input'];
  tenant?: InputMaybe<TenantCreateOrUpdateInput>;
  tenantId?: InputMaybe<Scalars['ID']['input']>;
};

export type ProfitAndLossRowsCreateOrUpdateManyInput = {
  data: Array<ProfitAndLossRowCreateOrUpdateInput>;
};

export type ProfitAndLossRowsInsertManyInput = {
  data: Array<ProfitAndLossRowInsertInput>;
};

export type ProfitAndLossRowsListFilter = {
  _and?: InputMaybe<Array<ProfitAndLossRowsListFilter>>;
  _not?: InputMaybe<ProfitAndLossRowsListFilter>;
  _or?: InputMaybe<Array<ProfitAndLossRowsListFilter>>;
  account?: InputMaybe<AccountsListFilter>;
  accountId?: InputMaybe<Scalars['ID']['input']>;
  accountId_in?: InputMaybe<Array<Scalars['ID']['input']>>;
  accountId_ne?: InputMaybe<Scalars['ID']['input']>;
  accountId_nin?: InputMaybe<Array<Scalars['ID']['input']>>;
  accountId_notnull?: InputMaybe<Scalars['ID']['input']>;
  accountId_null?: InputMaybe<Scalars['ID']['input']>;
  amount?: InputMaybe<Scalars['Float']['input']>;
  amount_gt?: InputMaybe<Scalars['Float']['input']>;
  amount_gte?: InputMaybe<Scalars['Float']['input']>;
  amount_in?: InputMaybe<Array<Scalars['Float']['input']>>;
  amount_lt?: InputMaybe<Scalars['Float']['input']>;
  amount_lte?: InputMaybe<Scalars['Float']['input']>;
  amount_ne?: InputMaybe<Scalars['Float']['input']>;
  amount_nin?: InputMaybe<Array<Scalars['Float']['input']>>;
  amount_notnull?: InputMaybe<Scalars['Float']['input']>;
  amount_null?: InputMaybe<Scalars['Float']['input']>;
  date?: InputMaybe<Scalars['ISOString']['input']>;
  date_gt?: InputMaybe<Scalars['ISOString']['input']>;
  date_gte?: InputMaybe<Scalars['ISOString']['input']>;
  date_in?: InputMaybe<Array<Scalars['ISOString']['input']>>;
  date_lt?: InputMaybe<Scalars['ISOString']['input']>;
  date_lte?: InputMaybe<Scalars['ISOString']['input']>;
  date_ne?: InputMaybe<Scalars['ISOString']['input']>;
  date_nin?: InputMaybe<Array<Scalars['ISOString']['input']>>;
  date_notnull?: InputMaybe<Scalars['ISOString']['input']>;
  date_null?: InputMaybe<Scalars['ISOString']['input']>;
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
  tenant?: InputMaybe<TenantsListFilter>;
  tenantId?: InputMaybe<Scalars['ID']['input']>;
  tenantId_in?: InputMaybe<Array<Scalars['ID']['input']>>;
  tenantId_ne?: InputMaybe<Scalars['ID']['input']>;
  tenantId_nin?: InputMaybe<Array<Scalars['ID']['input']>>;
  tenantId_notnull?: InputMaybe<Scalars['ID']['input']>;
  tenantId_null?: InputMaybe<Scalars['ID']['input']>;
};

export type ProfitAndLossRowsOrderByInput = {
  accountId?: InputMaybe<Sort>;
  amount?: InputMaybe<Sort>;
  date?: InputMaybe<Sort>;
  description?: InputMaybe<Sort>;
  id?: InputMaybe<Sort>;
  tenantId?: InputMaybe<Sort>;
};

export type ProfitAndLossRowsPaginationInput = {
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<ProfitAndLossRowsOrderByInput>;
};

export type ProfitAndLossRowsUpdateManyInput = {
  data: Array<ProfitAndLossRowCreateOrUpdateInput>;
};

export type Query = {
  __typename?: 'Query';
  _graphweaver: AdminUiMetadata;
  account?: Maybe<Account>;
  accounts: Array<Account>;
  profitAndLossRow?: Maybe<ProfitAndLossRow>;
  profitAndLossRows: Array<ProfitAndLossRow>;
  tenant?: Maybe<Tenant>;
  tenants: Array<Tenant>;
};


export type QueryAccountArgs = {
  id: Scalars['ID']['input'];
};


export type QueryAccountsArgs = {
  filter?: InputMaybe<AccountsListFilter>;
  pagination?: InputMaybe<AccountsPaginationInput>;
};


export type QueryProfitAndLossRowArgs = {
  id: Scalars['ID']['input'];
};


export type QueryProfitAndLossRowsArgs = {
  filter?: InputMaybe<ProfitAndLossRowsListFilter>;
  pagination?: InputMaybe<ProfitAndLossRowsPaginationInput>;
};


export type QueryTenantArgs = {
  id: Scalars['ID']['input'];
};


export type QueryTenantsArgs = {
  filter?: InputMaybe<TenantsListFilter>;
  pagination?: InputMaybe<TenantsPaginationInput>;
};

export enum Sort {
  Asc = 'ASC',
  Desc = 'DESC'
}

export type Tenant = {
  __typename?: 'Tenant';
  authEventId: Scalars['String']['output'];
  createdDateUtc: Scalars['String']['output'];
  id: Scalars['ID']['output'];
  tenantName: Scalars['String']['output'];
  tenantType: Scalars['String']['output'];
  updatedDateUtc: Scalars['String']['output'];
};

export type TenantCreateOrUpdateInput = {
  authEventId?: InputMaybe<Scalars['String']['input']>;
  createdDateUtc?: InputMaybe<Scalars['String']['input']>;
  id?: InputMaybe<Scalars['ID']['input']>;
  tenantName?: InputMaybe<Scalars['String']['input']>;
  tenantType?: InputMaybe<Scalars['String']['input']>;
  updatedDateUtc?: InputMaybe<Scalars['String']['input']>;
};

export type TenantInsertInput = {
  authEventId: Scalars['String']['input'];
  createdDateUtc: Scalars['String']['input'];
  tenantName: Scalars['String']['input'];
  tenantType: Scalars['String']['input'];
  updatedDateUtc: Scalars['String']['input'];
};

export type TenantsCreateOrUpdateManyInput = {
  data: Array<TenantCreateOrUpdateInput>;
};

export type TenantsInsertManyInput = {
  data: Array<TenantInsertInput>;
};

export type TenantsListFilter = {
  _and?: InputMaybe<Array<TenantsListFilter>>;
  _not?: InputMaybe<TenantsListFilter>;
  _or?: InputMaybe<Array<TenantsListFilter>>;
  authEventId?: InputMaybe<Scalars['String']['input']>;
  authEventId_ilike?: InputMaybe<Scalars['String']['input']>;
  authEventId_in?: InputMaybe<Array<Scalars['String']['input']>>;
  authEventId_like?: InputMaybe<Scalars['String']['input']>;
  authEventId_ne?: InputMaybe<Scalars['String']['input']>;
  authEventId_nin?: InputMaybe<Array<Scalars['String']['input']>>;
  authEventId_notnull?: InputMaybe<Scalars['String']['input']>;
  authEventId_null?: InputMaybe<Scalars['String']['input']>;
  createdDateUtc?: InputMaybe<Scalars['String']['input']>;
  createdDateUtc_ilike?: InputMaybe<Scalars['String']['input']>;
  createdDateUtc_in?: InputMaybe<Array<Scalars['String']['input']>>;
  createdDateUtc_like?: InputMaybe<Scalars['String']['input']>;
  createdDateUtc_ne?: InputMaybe<Scalars['String']['input']>;
  createdDateUtc_nin?: InputMaybe<Array<Scalars['String']['input']>>;
  createdDateUtc_notnull?: InputMaybe<Scalars['String']['input']>;
  createdDateUtc_null?: InputMaybe<Scalars['String']['input']>;
  id?: InputMaybe<Scalars['ID']['input']>;
  id_in?: InputMaybe<Array<Scalars['ID']['input']>>;
  id_ne?: InputMaybe<Scalars['ID']['input']>;
  id_nin?: InputMaybe<Array<Scalars['ID']['input']>>;
  id_notnull?: InputMaybe<Scalars['ID']['input']>;
  id_null?: InputMaybe<Scalars['ID']['input']>;
  tenantName?: InputMaybe<Scalars['String']['input']>;
  tenantName_ilike?: InputMaybe<Scalars['String']['input']>;
  tenantName_in?: InputMaybe<Array<Scalars['String']['input']>>;
  tenantName_like?: InputMaybe<Scalars['String']['input']>;
  tenantName_ne?: InputMaybe<Scalars['String']['input']>;
  tenantName_nin?: InputMaybe<Array<Scalars['String']['input']>>;
  tenantName_notnull?: InputMaybe<Scalars['String']['input']>;
  tenantName_null?: InputMaybe<Scalars['String']['input']>;
  tenantType?: InputMaybe<Scalars['String']['input']>;
  tenantType_ilike?: InputMaybe<Scalars['String']['input']>;
  tenantType_in?: InputMaybe<Array<Scalars['String']['input']>>;
  tenantType_like?: InputMaybe<Scalars['String']['input']>;
  tenantType_ne?: InputMaybe<Scalars['String']['input']>;
  tenantType_nin?: InputMaybe<Array<Scalars['String']['input']>>;
  tenantType_notnull?: InputMaybe<Scalars['String']['input']>;
  tenantType_null?: InputMaybe<Scalars['String']['input']>;
  updatedDateUtc?: InputMaybe<Scalars['String']['input']>;
  updatedDateUtc_ilike?: InputMaybe<Scalars['String']['input']>;
  updatedDateUtc_in?: InputMaybe<Array<Scalars['String']['input']>>;
  updatedDateUtc_like?: InputMaybe<Scalars['String']['input']>;
  updatedDateUtc_ne?: InputMaybe<Scalars['String']['input']>;
  updatedDateUtc_nin?: InputMaybe<Array<Scalars['String']['input']>>;
  updatedDateUtc_notnull?: InputMaybe<Scalars['String']['input']>;
  updatedDateUtc_null?: InputMaybe<Scalars['String']['input']>;
};

export type TenantsOrderByInput = {
  authEventId?: InputMaybe<Sort>;
  createdDateUtc?: InputMaybe<Sort>;
  id?: InputMaybe<Sort>;
  tenantName?: InputMaybe<Sort>;
  tenantType?: InputMaybe<Sort>;
  updatedDateUtc?: InputMaybe<Sort>;
};

export type TenantsPaginationInput = {
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<TenantsOrderByInput>;
};

export type TenantsUpdateManyInput = {
  data: Array<TenantCreateOrUpdateInput>;
};
