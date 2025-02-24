import { ChainedCommands, useCurrentEditor } from '@tiptap/react';
import {
	EditorBoldIcon,
	EditorCodeBlockIcon,
	EditorCodeIcon,
	EditorItalicIcon,
	EditorRedoIcon,
	EditorSeparatorIcon,
	EditorStrikeIcon,
	EditorUndoIcon,
} from '../../../../assets';
import { Props } from './utils';
import { HeaderOptions } from './header-options';
import { ListOptions } from './list-options';
import { LinkButton } from './link-button';
import { Button } from './button';
import styles from './styles.module.css';

export const MenuBar = (props: Props) => {
	const { options } = props;
	const { editor } = useCurrentEditor();

	if (!editor) {
		return null;
	}

	const getCommand = (
		command: {
			[K in keyof ChainedCommands]: ChainedCommands[K] extends () => ChainedCommands ? K : never;
		}[keyof ChainedCommands]
	) => {
		return () => editor.chain().focus()[command]().run();
	};

	return (
		<div className={styles.buttonContainer}>
			<HeaderOptions editor={editor} options={options} />
			<ListOptions editor={editor} options={options} />
			<Button
				hide={options.codeBlock?.hide}
				command={getCommand('toggleCodeBlock')}
				activeWhen="codeBlock"
				Icon={<EditorCodeBlockIcon />}
				title="Code Block"
			/>

			<div className={styles.verticalSeparator}></div>

			<Button
				hide={options.bold?.hide}
				command={getCommand('toggleBold')}
				activeWhen="bold"
				Icon={<EditorBoldIcon />}
				title="Bold"
			/>
			<Button
				hide={options.italic?.hide}
				command={getCommand('toggleItalic')}
				activeWhen="italic"
				Icon={<EditorItalicIcon />}
				title="Italic"
			/>
			<Button
				hide={options.strike?.hide}
				command={getCommand('toggleStrike')}
				activeWhen="strike"
				Icon={<EditorStrikeIcon />}
				title="Strike"
			/>
			<LinkButton editor={editor} options={options} />
			<Button
				hide={options.code?.hide}
				command={getCommand('toggleCode')}
				activeWhen="code"
				Icon={<EditorCodeIcon />}
				title="Code"
			/>
			<Button
				hide={options.horizontalRule?.hide}
				command={getCommand('setHorizontalRule')}
				Icon={<EditorSeparatorIcon />}
				title="Separator"
			/>

			<div className={styles.verticalSeparator}></div>

			<Button
				command={getCommand('undo')}
				Icon={<EditorUndoIcon />}
				disabled={!editor.can().chain().focus().undo().run()}
				title="Undo"
			/>
			<Button
				command={getCommand('redo')}
				Icon={<EditorRedoIcon />}
				disabled={!editor.can().chain().focus().redo().run()}
				title="Redo"
			/>
		</div>
	);
};
