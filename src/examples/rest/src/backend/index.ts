import Graphweaver from '@exogee/graphweaver-server';
import { AuthorizationContext } from '@exogee/graphweaver-auth';

import './schema';
import { traceProvider } from './schema/trace';
// Auth Functions
import { beforeRead, afterRead } from './auth';

export const graphweaver = new Graphweaver<AuthorizationContext>({
	adminMetadata: {
		enabled: true,
		hooks: {
			// These hooks filter the admin ui entities based on the logged in user
			beforeRead,
			afterRead,
		},
	},
	fileAutoGenerationOptions: {
		typesOutputPath: ['./'],
	},
	openTelemetry: {
		traceProvider,
		instrumentations: [],
	},
});
