import { EditorProvider } from '@tiptap/react';
import { useField } from 'formik';
import { EntityField } from '../../../utils';
import { MenuBar } from './menu-bar';
import { Props as MenuBarProps } from './menu-bar/utils';
import { getExtensions } from './utils';
import styles from './styles.module.css';

interface Props {
	field: EntityField;
	isReadOnly: boolean;
	options: MenuBarProps['options'];
	asMarkdown?: boolean;
}

export const RichTextField = (props: Props) => {
	const { field, isReadOnly, options, asMarkdown } = props;
	const [, meta, { setValue }] = useField<string>({ name: field.name });
	const content = meta.value;

	return (
		<div className={styles.richText}>
			<EditorProvider
				extensions={getExtensions({ asMarkdown })}
				content={content}
				slotBefore={isReadOnly ? undefined : <MenuBar options={options} />}
				onUpdate={(props) => {
					setValue(
						asMarkdown ? props.editor.storage.markdown.getMarkdown() : props.editor.getHTML()
					);
				}}
				editable={!isReadOnly}
				editorContainerProps={{
					className: styles.editorContainer,
				}}
				editorProps={{
					attributes: {
						class: styles.editor,
					},
				}}
			/>
		</div>
	);
};
