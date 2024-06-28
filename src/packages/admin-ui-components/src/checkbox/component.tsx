import { HTMLProps, useEffect, useRef, useId } from 'react';

import styles from './styles.module.css';

export const Checkbox = ({
	indeterminate,
	...rest
}: { indeterminate?: boolean } & HTMLProps<HTMLInputElement>) => {
	const ref = useRef<HTMLInputElement>(null!);
	const id = useId();

	useEffect(() => {
		if (typeof indeterminate === 'boolean') {
			ref.current.indeterminate = !rest.checked && indeterminate;
		}
	}, [ref, indeterminate]);

	return (
		<>
			<input type="checkbox" id={id} ref={ref} className={styles.checkbox} {...rest} />
			<label className={styles.label} htmlFor={id} />
		</>
	);
};
