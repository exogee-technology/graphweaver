import { useField } from 'formik';
import { useEffect, useRef } from 'react';
import { autoFocusDelay } from '../../config';

export const JSONField = ({ name, autoFocus }: { name: string; autoFocus: boolean }) => {
	const [_, meta] = useField({ name, multiple: false });
	const { initialValue } = meta;

	const codeRef = useRef<any>();
	useEffect(() => {
		if (autoFocus) {
			setTimeout(() => {
				codeRef.current?.focus();
			}, autoFocusDelay);
		}
	}, []);

	return (
		<code ref={codeRef} tabIndex={0}>
			{JSON.stringify(initialValue, null, 4)}
		</code>
	);
};
