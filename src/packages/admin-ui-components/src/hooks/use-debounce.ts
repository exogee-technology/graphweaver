import { useEffect } from 'react';

export const useDebounce = <T>(value: T, setter: (value: T) => any, delay: number = 500) => {
	useEffect(() => {
		const timer = setTimeout(() => setter(value), delay);

		return () => {
			clearTimeout(timer);
		};
	}, [value, delay]);
};
