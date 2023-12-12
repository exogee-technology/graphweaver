import { useField } from 'formik';

export const JSONField = ({ name }: { name: string }) => {
	const [_, meta] = useField({ name, multiple: false });
	const { initialValue } = meta;
	return <code>{JSON.stringify(initialValue, null, 4)}</code>;
};
