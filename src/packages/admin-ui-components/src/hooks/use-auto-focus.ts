import { useEffect, useRef } from 'react';
import { autoFocusDelay } from '../config';

export const useAutoFocus = <T extends HTMLElement>(autoFocus?: boolean) => {
	const ref = useRef<T>(null);
	useEffect(() => {
		if (autoFocus) {
			setTimeout(() => {
				ref.current?.focus();
			}, autoFocusDelay);
		}
	}, [autoFocus]);

	return ref;
};
