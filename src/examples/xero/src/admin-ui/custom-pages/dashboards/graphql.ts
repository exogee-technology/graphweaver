import { graphql } from '../../../__generated__';

graphql(`
	query Tenants {
		tenants {
			id
			tenantName
		}
	}
`);
