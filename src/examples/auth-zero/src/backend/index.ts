import Graphweaver from '@exogee/graphweaver-server';
import { setAddUserToContext } from '@exogee/graphweaver-auth';

import { addUserToContext } from './auth';
import './schema';

// This function is called when a user logs in
setAddUserToContext(addUserToContext);

export const graphweaver = new Graphweaver();
