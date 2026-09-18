import type { ColumnType } from '../ir/nodes';
import type { ResolvedColumn, ResolvedEntity, ResolvedRelationship } from '../mapping/types';

/**
 * A Chinook-shaped model covering all three relationship kinds. Hand-built rather than derived
 * from Graphweaver metadata, because the question here is filter translation, not mapping.
 */

const col = (
	property: string,
	name: string,
	type: ColumnType,
	nullable = false
): ResolvedColumn => ({
	property,
	name,
	type,
	nullable,
});

const columns = (...list: ResolvedColumn[]) =>
	new Map(list.map((entry) => [entry.property, entry]));

const relationships = (...list: ResolvedRelationship[]) =>
	new Map(list.map((entry) => [entry.property, entry]));

export const artist: ResolvedEntity = {
	name: 'Artist',
	table: 'artist',
	primaryKey: col('artistId', 'artist_id', 'int'),
	columns: columns(col('artistId', 'artist_id', 'int'), col('name', 'name', 'string')),
	relationships: relationships({
		kind: 'oneToMany',
		property: 'albums',
		target: () => album,
		targetForeignKey: () => col('artist', 'artist_id', 'int', true),
	}),
};

export const album: ResolvedEntity = {
	name: 'Album',
	table: 'album',
	primaryKey: col('albumId', 'album_id', 'int'),
	columns: columns(
		col('albumId', 'album_id', 'int'),
		col('title', 'title', 'string', true),
		col('released_at', 'released_at', 'datetime', true)
	),
	relationships: relationships(
		{
			kind: 'manyToOne',
			property: 'artist',
			foreignKey: col('artist', 'artist_id', 'int', true),
			target: () => artist,
		},
		{
			kind: 'oneToMany',
			property: 'tracks',
			target: () => track,
			targetForeignKey: () => col('album', 'album_id', 'int'),
		}
	),
};

export const track: ResolvedEntity = {
	name: 'Track',
	table: 'track',
	primaryKey: col('trackId', 'track_id', 'int'),
	columns: columns(
		col('trackId', 'track_id', 'int'),
		col('name', 'name', 'string'),
		col('composer', 'composer', 'string', true),
		col('unitPrice', 'unit_price', 'decimal'),
		col('milliseconds', 'milliseconds', 'int')
	),
	relationships: relationships(
		{
			kind: 'manyToOne',
			property: 'album',
			foreignKey: col('album', 'album_id', 'int'),
			target: () => album,
		},
		{
			kind: 'manyToMany',
			property: 'genres',
			target: () => genre,
			pivot: { table: 'track_genre', joinColumn: 'track_id', inverseJoinColumn: 'genre_id' },
		}
	),
};

export const genre: ResolvedEntity = {
	name: 'Genre',
	table: 'genre',
	primaryKey: col('genreId', 'genre_id', 'int'),
	columns: columns(col('genreId', 'genre_id', 'int'), col('name', 'name', 'string')),
	relationships: relationships({
		kind: 'manyToMany',
		property: 'tracks',
		target: () => track,
		pivot: { table: 'track_genre', joinColumn: 'genre_id', inverseJoinColumn: 'track_id' },
	}),
};

/** Exercises schema qualification, which only Postgres and SQL Server actually use. */
export const invoice: ResolvedEntity = {
	name: 'Invoice',
	schema: 'billing',
	table: 'invoice',
	primaryKey: col('invoiceId', 'invoice_id', 'int'),
	columns: columns(col('invoiceId', 'invoice_id', 'int'), col('total', 'total', 'decimal')),
	relationships: relationships(),
};
