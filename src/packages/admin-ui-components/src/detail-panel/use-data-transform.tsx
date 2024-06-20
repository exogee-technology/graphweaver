import { useEffect } from 'react';
import { EntityField } from '../utils';

export interface DataTransform<T> {
	field: EntityField;
	transform: (value: T) => T | Promise<T>;
}

export const dataTransforms: DataTransform<unknown>[] = [];

export const useRegisterDataTransform = (transform: DataTransform<unknown>) => {
	useEffect(() => {
		if (!dataTransforms.find((t) => t.field === transform.field)) {
			dataTransforms.push(transform);
		}

		return () => {
			dataTransforms.splice(
				dataTransforms.findIndex((t) => t.field === transform.field),
				1
			);
		};
	}, []);
};
