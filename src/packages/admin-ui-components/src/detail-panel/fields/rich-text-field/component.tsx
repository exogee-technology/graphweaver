import { EditorProvider } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import { useField } from 'formik';
import { EntityField } from '../../../utils';
import { MenuBar } from './menu-bar';
import { Props as MenuBarProps } from './menu-bar/utils';
import styles from './styles.module.css';

export const extensions = [
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
	options: MenuBarProps['options'];
}

export const RichTextField = (props: Props) => {
	const { field, isReadOnly, options } = props;
	const [formikField, _, { setValue }] = useField<string>({ name: field.name });
	const content = formikField.value;

	return (
		<div className={styles.richText}>
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
	);
};
