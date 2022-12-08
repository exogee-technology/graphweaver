import { useParams } from 'react-router-dom';
import { AllCompanies } from './all-companies';
import { SingleTenant } from './single-tenant';

export const XeroDashboard = () => {
	const { tenantId } = useParams();

	return tenantId ? <SingleTenant tenantId={tenantId} /> : <AllCompanies />;
};
