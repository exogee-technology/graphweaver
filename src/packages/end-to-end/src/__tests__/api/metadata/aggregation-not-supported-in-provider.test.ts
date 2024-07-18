import gql from 'graphql-tag';
import assert from 'assert';
import Graphweaver from '@exogee/graphweaver-server';
import { Field, ID, Entity, BaseDataProvider } from '@exogee/graphweaver';

describe('Aggregation - Not Supported in Provider', () => {
	interface DeprecatedProductData {
		sku: string;
		package: string;
		reason: string;
		createdBy: string;
	}

	const deprecatedProduct: DeprecatedProductData = {
		sku: 'apollo-federation-v1',
		package: '@apollo/federation-v1',
		reason: 'Migrate to Federation V2',
		createdBy: 'support@apollographql.com',
	};

	class JsonDataProvider extends BaseDataProvider<DeprecatedProductData> {
		async find() {
			return [deprecatedProduct];
		}
		async findOne() {
			return deprecatedProduct;
		}
	}

	/** Setup entities and resolvers  */
	@Entity<DeprecatedProduct>('DeprecatedProduct', {
		provider: new JsonDataProvider('json'),
	})
	class DeprecatedProduct {
		@Field(() => ID, { primaryKeyField: true })
		sku!: string;

		@Field(() => String, { adminUIOptions: { summaryField: true } })
		package!: string;

		@Field(() => String)
		reason!: string;

		@Field(() => String)
		createdBy!: string;
	}

	const graphweaver = new Graphweaver();

	test('Introspection should not have an aggregate root product query because the provider has not declared support', async () => {
		const response = await graphweaver.server.executeOperation({
			query: gql`
				query {
					deprecatedProducts_aggregate {
						count
					}
				}
			`,
		});

		assert(response.body.kind === 'single');
		expect(response.body.singleResult.errors?.length).toBe(1);
		expect(response.body.singleResult.errors?.[0].message).toBe(
			'Cannot query field "deprecatedProducts_aggregate" on type "Query". [Suggestion hidden]?'
		);

		const introspectionResponse = await graphweaver.server.executeOperation({
			query: gql`
				query {
					__schema {
						queryType {
							fields {
								name
							}
						}
					}
				}
			`,
		});

		assert(introspectionResponse.body.kind === 'single');
		expect(
			(introspectionResponse.body.singleResult.data as any).__schema.queryType.fields
		).toMatchObject([
			{ name: 'deprecatedProduct' },
			{ name: 'deprecatedProducts' },
			{ name: '_graphweaver' },
		]);
	});

	test('_graphweaver should indicate that the entity does not support aggregation', async () => {
		const response = await graphweaver.server.executeOperation<{
			_graphweaver: {
				entities: [{ name: string; supportedAggregationTypes: string[] }];
			};
		}>({
			query: gql`
				query {
					_graphweaver {
						entities {
							name
							supportedAggregationTypes
						}
					}
				}
			`,
		});

		assert(response.body.kind === 'single');
		expect(response.body.singleResult.errors).toBeUndefined();
		const filteredEntities = response.body.singleResult.data?._graphweaver.entities.filter(
			(entity) => entity.name === 'DeprecatedProduct'
		);
		expect(filteredEntities).toMatchObject([
			{
				name: 'DeprecatedProduct',
				supportedAggregationTypes: [],
			},
		]);
	});
});
