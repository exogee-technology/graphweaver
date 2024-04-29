import gql from 'graphql-tag';
import assert from 'assert';
import Graphweaver from '@exogee/graphweaver-server';
import { Entity, Field, GraphQLEntity, ID, SummaryField } from '@exogee/graphweaver';
import { Schema } from '@exogee/graphweaver-admin-ui-components';

@Entity('Album', { exportPageSize: 500 })
export class Album extends GraphQLEntity<unknown> {
	public dataEntity!: unknown;

	@Field(() => ID)
	id!: number;

	@SummaryField()
	@Field(() => String)
	title!: string;
}

@Entity('Artist', { exportPageSize: 100 })
export class Artist extends GraphQLEntity<unknown> {
	public dataEntity!: unknown;

	@Field(() => ID)
	id!: number;

	@SummaryField()
	@Field(() => String, { nullable: true })
	name?: string;
}

test('Should return exportPageSize attribute for each entity in getAdminUiMetadata', async () => {
	const graphweaver = new Graphweaver();

	const response = await graphweaver.server.executeOperation({
		query: gql`
			{
				result: _graphweaver {
					entities {
						name
						backendId
						summaryField
						fields {
							name
							type
							relationshipType
							relatedEntity
							filter {
								type
								__typename
							}
							attributes {
								isReadOnly
								__typename
							}
							__typename
						}
						attributes {
							isReadOnly
							exportPageSize
							__typename
						}
						__typename
					}
					enums {
						name
						values {
							name
							value
							__typename
						}
						__typename
					}
					__typename
				}
			}
		`,
	});
	assert(response.body.kind === 'single');
	const result = response.body.singleResult.data?.result as unknown as Schema;
	expect(result.entities).toHaveLength(2);

	const albumEntity = result.entities.find((entity) => entity.name === 'Album');
	expect(albumEntity).not.toBeNull();
	expect(albumEntity?.attributes.exportPageSize).toEqual(500);

	const artistEntity = result.entities.find((entity) => entity.name === 'Artist');
	expect(artistEntity).not.toBeNull();
	expect(artistEntity?.attributes.exportPageSize).toEqual(100);
});
