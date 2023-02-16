import type { ReactNode } from 'react';
import { useSchema } from '../utils';
import { Spinner } from '../spinner';

export interface RequireSchemaProps {
	children?: ReactNode;
}

export const RequireSchema = ({ children }: RequireSchemaProps): JSX.Element => {
	const { loading, error } = useSchema();

	if (error) return <div>{error.message}</div>;

	// If we're still loading, return the spinner, else, we're ready to go.
	return loading ? <Spinner /> : <>{children}</>;
};
