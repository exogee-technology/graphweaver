import Graphweaver from '@exogee/graphweaver-server';
import './schema';

export const graphweaver = new Graphweaver();

export const azureHandler = graphweaver.azureHandler();
