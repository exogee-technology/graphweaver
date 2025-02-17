import { EditorProvider } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import { useField } from 'formik';
import { EntityField } from '../../../utils';
import { MenuBar } from './menu-bar';
import styles from './styles.module.css';

const extensions = [
	StarterKit.configure({
		bulletList: {
			keepMarks: true,
			keepAttributes: false,
		},
		orderedList: {
			keepMarks: true,
			keepAttributes: false,
		},
	}),
	Link.configure({
		HTMLAttributes: {
			rel: 'noopener noreferrer',
			target: '_blank',
		},
		openOnClick: false,
	}),
];

interface Props {
	field: EntityField;
	isReadOnly: boolean;
	options: Record<string, unknown>;
}

export const MarkdownField = (props: Props) => {
	const { field, isReadOnly, options } = props;
	const [formikField, _, { setValue }] = useField<string>({ name: field.name });
	const content = formikField.value;

	return (
		<div>
			<div className={styles.label}>{field.name}</div>
			<div className={styles.markdown}>
				<EditorProvider
					extensions={extensions}
					content={content}
					slotBefore={isReadOnly ? undefined : <MenuBar options={options} />}
					onUpdate={(props) => {
						setValue(props.editor.getHTML());
					}}
					editable={!isReadOnly}
				/>
			</div>
		</div>
	);
};
