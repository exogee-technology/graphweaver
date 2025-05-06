import gql from 'graphql-tag';
import assert from 'assert';
import Graphweaver from '@exogee/graphweaver-server';
import { graphweaverMetadata } from '@exogee/graphweaver';


test('should correctly handle non entity list return type.', async () => {
    graphweaverMetadata.addQuery({
        name: 'test',
        getType: () => [String],
        resolver: () => Promise.resolve(['a', 'b']),
    });

    const graphweaver = new Graphweaver();

    const response = await graphweaver.executeOperation<{
        test: string[];
    }>({
        query: gql`
			query {
				test
			}
		`,
    });
    assert(response.body.kind === "single");
    expect(response.body.singleResult.errors).toBeUndefined();
    expect(response.body.singleResult.data).toMatchObject({
        test: ['a', 'b']
    });
});