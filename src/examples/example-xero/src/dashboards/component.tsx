import { useParams } from 'react-router-dom';
import { AllCompanies } from './all-companies';
import { SingleCompany } from './single-company';

export const XeroDashboard = () => {
	const { tenantId } = useParams();

	return tenantId ? <SingleCompany /> : <AllCompanies />;
};
