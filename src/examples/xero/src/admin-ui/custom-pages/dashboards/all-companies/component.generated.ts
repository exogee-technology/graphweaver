/* eslint-disable */
/* 
* This file is auto-generated by Graphweaver. 
* Please do not edit it directly.
*/
import * as Types from '../../../../types.generated';

import { gql } from '@apollo/client';
import * as Apollo from '@apollo/client';
const defaultOptions = {} as const;
export type ProfitAndLossRowsQueryVariables = Types.Exact<{
  description: Types.Scalars['String']['input'];
}>;


export type ProfitAndLossRowsQuery = { __typename?: 'Query', profitAndLossRows: Array<{ __typename?: 'ProfitAndLossRow', amount: number, date: any, tenant?: { __typename?: 'Tenant', id: string, tenantName: string } | null }> };


export const ProfitAndLossRowsDocument = gql`
    query profitAndLossRows($description: String!) {
  profitAndLossRows(filter: {description: $description}) {
    amount
    date
    tenant {
      id
      tenantName
    }
  }
}
    `;

/**
 * __useProfitAndLossRowsQuery__
 *
 * To run a query within a React component, call `useProfitAndLossRowsQuery` and pass it any options that fit your needs.
 * When your component renders, `useProfitAndLossRowsQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useProfitAndLossRowsQuery({
 *   variables: {
 *      description: // value for 'description'
 *   },
 * });
 */
export function useProfitAndLossRowsQuery(baseOptions: Apollo.QueryHookOptions<ProfitAndLossRowsQuery, ProfitAndLossRowsQueryVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<ProfitAndLossRowsQuery, ProfitAndLossRowsQueryVariables>(ProfitAndLossRowsDocument, options);
      }
export function useProfitAndLossRowsLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<ProfitAndLossRowsQuery, ProfitAndLossRowsQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<ProfitAndLossRowsQuery, ProfitAndLossRowsQueryVariables>(ProfitAndLossRowsDocument, options);
        }
export type ProfitAndLossRowsQueryHookResult = ReturnType<typeof useProfitAndLossRowsQuery>;
export type ProfitAndLossRowsLazyQueryHookResult = ReturnType<typeof useProfitAndLossRowsLazyQuery>;
export type ProfitAndLossRowsQueryResult = Apollo.QueryResult<ProfitAndLossRowsQuery, ProfitAndLossRowsQueryVariables>;