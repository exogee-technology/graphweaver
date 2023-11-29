import fetch from 'node-fetch';
import { mapId } from './salesforce';

type DataEntity = any;

export const getOneAccount = async (id: string): Promise<any> => {
	throw new Error('Not implemented');
};

export const getManyAccounts = async (
	salesforceInstanceUrl: string,
	salesforceToken: string,
	_filter: any
): Promise<any> => {
	console.log('getManyAccounts: \n', salesforceInstanceUrl, salesforceToken);
	// make a graphql query to salesforce
	const query = `query Accounts{
			uiapi {
				query {
					Account {
						edges {
							node { 
								Id
								Name { value  }
							}
						}
					}
				}
			}
		}`;

	const response = await fetch(salesforceInstanceUrl, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
			Accept: 'application/json',
			Authorization: `Bearer ${salesforceToken}`,
		},
		body: JSON.stringify({
			query: query,
		}),
	});

	const data = await response.json();
	console.log('**************************\n');

	const flattened = flattenResponse(data as SalesforceAccountGraphQLResponse);
	console.log(flattened);
	console.log('**************************\n');
	return flattened;
};

type SalesforceAccountGraphQLResponse = {
	data: {
		uiapi: {
			query: {
				Account: {
					edges: Array<{
						node: {
							Id: string;
							Name: {
								value: string;
							};
						};
					}>;
				};
			};
		};
	};
	errors: Array<any>;
};

const flattenResponse = (response: SalesforceAccountGraphQLResponse) => {
	return response.data.uiapi.query.Account.edges.map((edge) => {
		return { id: edge.node.Id, name: edge.node.Name.value };
	});
};
