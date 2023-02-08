import { useSchema } from '../utils';
import { Spinner } from '../spinner';

export const RequireSchema = ({ children }: { children?: React.ReactNode }) => {
	const { loading, error } = useSchema();

	if (error) return <div>{error.message}</div>;

	// If we're still loading, return the spinner, else, we're ready to go.
	return loading ? <Spinner /> : <>{children}</>;
};
