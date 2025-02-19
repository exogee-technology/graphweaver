import { useCurrentEditor } from '@tiptap/react';
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
import styles from './styles.module.css';

export const MenuBar = (props: Props) => {
	const { options } = props;
	const { editor } = useCurrentEditor();

	if (!editor) {
		return null;
	}

	const handleBoldClick = (event: React.MouseEvent<HTMLButtonElement>) => {
		event.preventDefault();
		event.stopPropagation();
		editor.chain().focus().toggleBold().run();
	};

	const handleItalicClick = (event: React.MouseEvent<HTMLButtonElement>) => {
		event.preventDefault();
		event.stopPropagation();
		editor.chain().focus().toggleItalic().run();
	};

	const handleStrikeClick = (event: React.MouseEvent<HTMLButtonElement>) => {
		event.preventDefault();
		event.stopPropagation();
		editor.chain().focus().toggleStrike().run();
	};

	const handleCodeClick = (event: React.MouseEvent<HTMLButtonElement>) => {
		event.preventDefault();
		event.stopPropagation();
		editor.chain().focus().toggleCode().run();
	};

	const handleCodeBlockClick = (event: React.MouseEvent<HTMLButtonElement>) => {
		event.preventDefault();
		event.stopPropagation();
		editor.chain().focus().toggleCodeBlock().run();
	};

	const handleHorizontalRuleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
		event.preventDefault();
		event.stopPropagation();
		editor.chain().focus().setHorizontalRule().run();
	};

	const handleUndoClick = (event: React.MouseEvent<HTMLButtonElement>) => {
		event.preventDefault();
		event.stopPropagation();
		editor.chain().focus().undo().run();
	};

	const handleRedoClick = (event: React.MouseEvent<HTMLButtonElement>) => {
		event.preventDefault();
		event.stopPropagation();
		editor.chain().focus().redo().run();
	};

	return (
		<div className={styles.buttonContainer}>
			<HeaderOptions editor={editor} options={options} />
			<ListOptions editor={editor} options={options} />
			{!options.blockquote?.hide && (
				<button
					onClick={handleCodeBlockClick}
					className={editor.isActive('codeBlock') ? styles.isActive : ''}
				>
					<EditorCodeBlockIcon />
				</button>
			)}

			<div className={styles.verticalSeparator}></div>

			{!options.bold?.hide && (
				<button
					onClick={handleBoldClick}
					className={editor.isActive('bold') ? styles.isActive : ''}
				>
					<EditorBoldIcon />
				</button>
			)}
			{!options.italic?.hide && (
				<button
					onClick={handleItalicClick}
					className={editor.isActive('italic') ? styles.isActive : ''}
				>
					<EditorItalicIcon />
				</button>
			)}
			{!options.strike?.hide && (
				<button
					onClick={handleStrikeClick}
					className={editor.isActive('strike') ? styles.isActive : ''}
				>
					<EditorStrikeIcon />
				</button>
			)}
			<LinkButton editor={editor} options={options} />
			{!options.code?.hide && (
				<button
					onClick={handleCodeClick}
					className={editor.isActive('code') ? styles.isActive : ''}
				>
					<EditorCodeIcon />
				</button>
			)}
			{!options.horizontalRule?.hide && (
				<button onClick={handleHorizontalRuleClick}>
					<EditorSeparatorIcon />
				</button>
			)}

			<div className={styles.verticalSeparator}></div>

			<button onClick={handleUndoClick} disabled={!editor.can().chain().focus().undo().run()}>
				<EditorUndoIcon />
			</button>
			<button onClick={handleRedoClick} disabled={!editor.can().chain().focus().redo().run()}>
				<EditorRedoIcon />
			</button>
		</div>
	);
};
