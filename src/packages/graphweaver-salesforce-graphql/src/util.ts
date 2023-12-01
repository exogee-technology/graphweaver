import fetch from 'node-fetch';

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

export const getOneAccount = async (
	id: string,
	salesforceInstanceUrl: string,
	salesforceToken: string,
	_filter: any
): Promise<any> => {
	// Make a graphql query to salesforce
	const query = `query Account{
		uiapi {
			query {
			  Account(where: { Id: { eq: "${id}" } }) {
				edges {
				  node {
					Id
					Name {
					  value
					}
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
	console.log('**********************\n');
	console.log('getOneAccount data:', data);
	const flattened = flattenResponse(data as SalesforceAccountGraphQLResponse);
	console.log('**********************\n');

	return flattened;
};

export const getManyAccounts = async (
	salesforceInstanceUrl: string,
	salesforceToken: string,
	_filter: any
): Promise<any> => {
	// Make a graphql query to salesforce
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

	const flattened = flattenResponse(data as SalesforceAccountGraphQLResponse);

	return flattened;
};

const flattenResponse = (response: SalesforceAccountGraphQLResponse) => {
	return response.data.uiapi.query.Account.edges.map((edge) => {
		return { id: edge.node.Id, name: edge.node.Name.value };
	});
};
