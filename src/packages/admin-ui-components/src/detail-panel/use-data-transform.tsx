import { useEffect } from 'react';
import { EntityField } from '../utils';

export interface DataTransform<T> {
	field: EntityField;
	transform: (value: T) => T | Promise<T>;
}

export const dataTransforms: Record<string, DataTransform<unknown>> = {};

export const useDataTransform = (transform: DataTransform<unknown>) => {
	useEffect(() => {
		dataTransforms[transform.field.name] = transform;

		return () => {
			delete dataTransforms[transform.field.name];
		};
	}, []);
};
