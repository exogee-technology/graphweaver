import { UserResolver } from './user';
import { SubmissionResolver } from './submission';
import { UploadResolver } from '@exogee/graphweaver-storage-provider';

export const resolvers = [UserResolver, SubmissionResolver, UploadResolver];
