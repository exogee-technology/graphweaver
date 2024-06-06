import { addDirectives } from './directives';
import { addEntitiesQuery } from './entities';
import { addEnums } from './enums';
import { addServiceQuery } from './service';

export const enableFederation = () => {
	addEnums();
	addDirectives();
	addServiceQuery();
	addEntitiesQuery();
};
