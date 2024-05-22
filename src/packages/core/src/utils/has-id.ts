import { WithId } from '..';

export const hasId = <G>(obj: Partial<G>): obj is Partial<G> & WithId => {
	return 'id' in obj && typeof obj.id === 'string';
};
