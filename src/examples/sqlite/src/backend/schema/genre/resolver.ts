import { createBaseResolver, Resolver } from '@exogee/graphweaver';
import { MikroBackendProvider } from '@exogee/graphweaver-mikroorm';
import { Genre } from './entity';
import { Genre as OrmGenre } from '../../entities';
import { connection } from '../../database';

@Resolver((of) => Genre)
export class GenreResolver extends createBaseResolver<Genre, OrmGenre>(
	Genre,
	new MikroBackendProvider(OrmGenre, connection)
) {}
