import { Album } from './album';
import { Artist } from './artist';
import { Customer } from './customer';
import { Employee } from './employee';
import { Genre } from './genre';
import { Invoice } from './invoice';
import { InvoiceLine } from './invoice-line';
import { MediaType } from './media-type';
import { Playlist } from './playlist';
import { Track } from './track';

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

export const entities = [
	Album,
	Artist,
	Customer,
	Employee,
	Genre,
	Invoice,
	InvoiceLine,
	MediaType,
	Playlist,
	Track,
];
