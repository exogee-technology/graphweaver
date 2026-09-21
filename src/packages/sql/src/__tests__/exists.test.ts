import { describe, expect, it } from 'vitest';
import { compile } from '../compile/compiler';
import { postgres } from '../dialect';
import { planFind } from '../plan/select';
import { album, track } from './fixtures';

const sqlFor = (...args: Parameters<typeof planFind>) => compile(planFind(...args), postgres).text;

/**
 * `_exists` is the filter grammar's answer to "has any related rows", which it otherwise cannot
 * ask. `_not: { tracks: {} }` says it and compiles correctly, but core's `cleanFilter` drops empty
 * filter objects on the way in, so through the API that condition disappears and every row matches
 * -- a silent wrong answer rather than an error, which is what makes a real operator worth having.
 */
describe('relationship _exists', () => {
	it('asks for at least one related row', () => {
		const sql = sqlFor(album, { tracks_exists: true });

		expect(sql).toContain('EXISTS (SELECT 1 FROM "track" "s1"');
		expect(sql).not.toContain('NOT EXISTS');
	});

	it('asks for none', () => {
		const sql = sqlFor(album, { tracks_exists: false });

		expect(sql).toContain('NOT EXISTS (SELECT 1 FROM "track" "s1"');
	});

	it('carries only the correlation, so any related row at all counts', () => {
		const sql = sqlFor(album, { tracks_exists: true });

		expect(sql).toContain('WHERE "s1"."album_id" = "t0"."album_id"');
		// No second condition inside the subquery.
		expect(sql.slice(sql.indexOf('EXISTS'))).not.toContain(' AND ');
	});

	it('answers a many-to-one from the foreign key, with no subquery at all', () => {
		// The foreign key is already on this table, so "has an album" is a null check. Exact given
		// a foreign key constraint, which is the only way the column gets here in the first place.
		expect(sqlFor(track, { album_exists: true })).toContain('"t0"."album_id" IS NOT NULL');
		expect(sqlFor(track, { album_exists: false })).not.toContain('SELECT 1 FROM');
	});

	it('works on a many-to-many, through the pivot', () => {
		const sql = sqlFor(track, { genres_exists: true });

		expect(sql).toContain('EXISTS (SELECT 1 FROM');
		expect(sql).toContain('track_genre');
	});

	it('composes with the rest of the grammar', () => {
		const sql = sqlFor(album, { _or: [{ tracks_exists: false }, { title: 'x' }] });

		expect(sql).toContain('NOT EXISTS');
		expect(sql).toContain(' OR ');
	});

	it('refuses a value that is not a boolean, rather than guessing', () => {
		// The mistake this catches is `{ tracks_exists: { name: 'x' } }`, which looks like it
		// should filter the tracks and does not.
		expect(() => sqlFor(album, { tracks_exists: { name: 'x' } })).toThrow(/takes true or false/);
	});
});
