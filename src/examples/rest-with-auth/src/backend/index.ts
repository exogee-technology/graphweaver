import Graphweaver from '@exogee/graphweaver-server';
import { AuthorizationContext } from '@exogee/graphweaver-auth';

import './auth';
import './schema';

import { traceProvider } from './schema/trace';

export const graphweaver = new Graphweaver<AuthorizationContext>({
	fileAutoGenerationOptions: {
		typesOutputPath: ['./'],
	},
	openTelemetry: {
		traceProvider,
		instrumentations: [],
	},
});
