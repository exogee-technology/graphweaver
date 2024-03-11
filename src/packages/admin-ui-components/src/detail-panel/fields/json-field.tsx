import { useField } from 'formik';

import { useAutoFocus } from '../../hooks';

export const JSONField = ({ name, autoFocus }: { name: string; autoFocus: boolean }) => {
	const [_, meta] = useField({ name, multiple: false });
	const { initialValue } = meta;

	const inputRef = useAutoFocus<HTMLInputElement>(autoFocus);

	return (
		<code ref={inputRef} tabIndex={0}>
			{JSON.stringify(initialValue, null, 4)}
		</code>
	);
};
