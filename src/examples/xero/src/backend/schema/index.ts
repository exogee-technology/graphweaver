import { AccountResolver } from './AccountResolver';
import { ProfitAndLossRowResolver } from './ProfitAndLossRowResolver';
import { TenantResolver } from './TenantResolver';

// The Function type is the type that Type GraphQL expects
// eslint-disable-next-line @typescript-eslint/ban-types
export const resolvers: [Function, ...Function[]] = [
	AccountResolver,
	ProfitAndLossRowResolver,
	TenantResolver,
];
