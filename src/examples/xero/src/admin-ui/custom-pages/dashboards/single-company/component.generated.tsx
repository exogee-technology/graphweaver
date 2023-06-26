/* eslint-disable */
import * as Types from '../../../../types.generated';

import { gql } from '@apollo/client';
import * as Apollo from '@apollo/client';
const defaultOptions = {} as const;
export type ProfitAndLossRowsSingleCompanyQueryVariables = Types.Exact<{
  tenantId: Types.Scalars['ID']['input'];
}>;


export type ProfitAndLossRowsSingleCompanyQuery = { __typename?: 'Query', profitAndLossRows: Array<{ __typename?: 'ProfitAndLossRow', amount: number, date: any, description: string, account?: { __typename?: 'Account', name?: string | null, type?: Types.AccountType | null } | null }> };


export const ProfitAndLossRowsSingleCompanyDocument = gql`
    query profitAndLossRowsSingleCompany($tenantId: ID!) {
  profitAndLossRows(filter: {tenantId: $tenantId}) {
    amount
    date
    description
    account {
      name
      type
    }
  }
}
    `;

/**
 * __useProfitAndLossRowsSingleCompanyQuery__
 *
 * To run a query within a React component, call `useProfitAndLossRowsSingleCompanyQuery` and pass it any options that fit your needs.
 * When your component renders, `useProfitAndLossRowsSingleCompanyQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useProfitAndLossRowsSingleCompanyQuery({
 *   variables: {
 *      tenantId: // value for 'tenantId'
 *   },
 * });
 */
export function useProfitAndLossRowsSingleCompanyQuery(baseOptions: Apollo.QueryHookOptions<ProfitAndLossRowsSingleCompanyQuery, ProfitAndLossRowsSingleCompanyQueryVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<ProfitAndLossRowsSingleCompanyQuery, ProfitAndLossRowsSingleCompanyQueryVariables>(ProfitAndLossRowsSingleCompanyDocument, options);
      }
export function useProfitAndLossRowsSingleCompanyLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<ProfitAndLossRowsSingleCompanyQuery, ProfitAndLossRowsSingleCompanyQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<ProfitAndLossRowsSingleCompanyQuery, ProfitAndLossRowsSingleCompanyQueryVariables>(ProfitAndLossRowsSingleCompanyDocument, options);
        }
export type ProfitAndLossRowsSingleCompanyQueryHookResult = ReturnType<typeof useProfitAndLossRowsSingleCompanyQuery>;
export type ProfitAndLossRowsSingleCompanyLazyQueryHookResult = ReturnType<typeof useProfitAndLossRowsSingleCompanyLazyQuery>;
export type ProfitAndLossRowsSingleCompanyQueryResult = Apollo.QueryResult<ProfitAndLossRowsSingleCompanyQuery, ProfitAndLossRowsSingleCompanyQueryVariables>;