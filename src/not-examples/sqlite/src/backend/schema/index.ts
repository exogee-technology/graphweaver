import { AlbumResolver } from './album';
import { ArtistResolver } from './artist';
import { CustomerResolver } from './customer';
import { EmployeeResolver } from './employee';
import { GenreResolver } from './genre';
import { InvoiceResolver } from './invoice';
import { InvoiceLineResolver } from './invoice-line';
import { MediaTypeResolver } from './media-type';
import { PlaylistResolver } from './playlist';
import { TrackResolver } from './track';

export * from './album';
export * from './artist';
export * from './customer';
export * from './employee';
export * from './genre';
export * from './invoice';
export * from './invoice-line';
export * from './media-type';
export * from './playlist';
export * from './track';

export const resolvers = [
	AlbumResolver,
	ArtistResolver,
	CustomerResolver,
	EmployeeResolver,
	GenreResolver,
	InvoiceResolver,
	InvoiceLineResolver,
	MediaTypeResolver,
	PlaylistResolver,
	TrackResolver,
];
