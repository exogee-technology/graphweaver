import Graphweaver from '@exogee/graphweaver-server';
import { AuthorizationContext } from '@exogee/graphweaver-auth';

import './schema';
import { traceProvider } from './schema/trace';
// Auth Functions
import { afterRead } from './auth';

export const graphweaver = new Graphweaver<AuthorizationContext>({
	adminMetadata: {
		enabled: true,
		hooks: {
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
