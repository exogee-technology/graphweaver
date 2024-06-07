const dimension = {
	id: 'dimension',
	size: 'small',
	weight: 1,
	unit: 'kg',
};

const user = {
	email: 'support@apollographql.com',
	name: 'Jane Smith',
	averageProductsCreatedPerYear: 134,
	totalProductsCreated: 1337,
	yearsOfEmployment: 10,
};

const deprecatedProduct = {
	sku: 'apollo-federation-v1',
	package: '@apollo/federation-v1',
	reason: 'Migrate to Federation V2',
	createdBy: 'support@apollographql.com',
	inventoryId: 'apollo-oss',
};

const productsResearch = [
	{
		study: {
			caseNumber: '1234',
			description: 'Federation Study',
		},
		outcome: null,
		productId: 'apollo-federation',
	},
	{
		study: {
			caseNumber: '1235',
			description: 'Studio Study',
		},
		outcome: null,
		productId: 'apollo-studio',
	},
];

const products = [
	{
		id: 'apollo-federation',
		sku: 'federation',
		package: '@apollo/federation',
		variation: 'OSS',
		dimensions: 'dimension',
		createdBy: 'support@apollographql.com',
		notes: null,
	},
	{
		id: 'apollo-studio',
		sku: 'studio',
		package: '',
		variation: 'platform',
		dimensions: 'dimension',
		createdBy: 'support@apollographql.com',
		notes: null,
	},
];

const inventory = {
	id: 'apollo-oss',
};

const variations = [
	{
		id: 'OSS',
	},
	{
		id: 'platform',
	},
];

export const data = {
	deprecatedProduct,
	dimension,
	inventory,
	productsResearch,
	products,
	variations,
	user,
};
