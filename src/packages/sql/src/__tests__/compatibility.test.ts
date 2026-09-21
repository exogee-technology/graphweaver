import { afterEach, describe, expect, it } from 'vitest';
import { compile } from '../compile/compiler';
import { postgres } from '../dialect';
import { planFind } from '../plan/select';
import { SqlDataProvider } from '../provider';
import { album } from './fixtures';

const sqlFor = (...args: Parameters<typeof planFind>) => compile(planFind(...args), postgres).text;

/**
 * The one place the filter grammar can be asked not to mean what it says.
 *
 * `{ tracks: { trackId_null: true } }` matched "albums with no tracks" under the MikroORM provider,
 * which compiled relationship filters to a LEFT JOIN. Under a correlated EXISTS it asks for a track
 * whose primary key is null and matches nothing -- so a project carrying that filter gets empty
 * results rather than an error, which is why there is an opt-in rather than just a release note.
 */
describe('SqlDataProvider.treatRelationshipNullAsAbsent', () => {
	afterEach(() => {
		SqlDataProvider.treatRelationshipNullAsAbsent = false;
	});

	it('is off, so the filter means what it says', () => {
		expect(SqlDataProvider.treatRelationshipNullAsAbsent).toBe(false);
		expect(sqlFor(album, { tracks: { trackId_null: true } })).not.toContain('NOT EXISTS');
	});

	it('turns the idiom into NOT EXISTS when switched on', () => {
		SqlDataProvider.treatRelationshipNullAsAbsent = true;

		const sql = sqlFor(album, { tracks: { trackId_null: true } });

		expect(sql).toContain('NOT EXISTS (SELECT 1 FROM "track" "s1"');
		expect(sql).not.toContain('IS NULL');
	});

	it('still leaves a nullable column alone, where the literal reading is a real question', () => {
		SqlDataProvider.treatRelationshipNullAsAbsent = true;

		const sql = sqlFor(album, { tracks: { composer_null: true } });

		expect(sql).toContain('EXISTS (SELECT 1 FROM "track" "s1"');
		expect(sql).not.toContain('NOT EXISTS');
		expect(sql).toContain('IS NULL');
	});

	it('still leaves anything but a lone `_null` alone', () => {
		SqlDataProvider.treatRelationshipNullAsAbsent = true;

		// Two conditions: whatever the caller meant, it was not "has no tracks".
		const sql = sqlFor(album, { tracks: { trackId_null: true, name: 'x' } });

		expect(sql).not.toContain('NOT EXISTS');
	});
});
