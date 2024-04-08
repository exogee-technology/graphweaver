import { createBaseResolver, Resolver } from '@exogee/graphweaver';
import { MikroBackendProvider } from '@exogee/graphweaver-mikroorm';

import { Submission as OrmSubmission } from '../../entities';
import { Submission } from './entity';
import { pgConnection } from '../../database';

@Resolver((of) => Submission)
export class SubmissionResolver extends createBaseResolver<Submission, OrmSubmission>(
	Submission,
	new MikroBackendProvider(OrmSubmission, pgConnection)
) {}
