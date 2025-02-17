import { useCurrentEditor } from '@tiptap/react';
import styles from './styles.module.css';

interface Props {
	options: {
		bold?: { hide?: boolean };
		italic?: { hide?: boolean };
		strike?: { hide?: boolean };
		code?: { hide?: boolean };
		h1?: { hide?: boolean };
		h2?: { hide?: boolean };
		h3?: { hide?: boolean };
		h4?: { hide?: boolean };
		h5?: { hide?: boolean };
		h6?: { hide?: boolean };
		link?: { hide?: boolean };
		bulletList?: { hide?: boolean };
		orderedList?: { hide?: boolean };
		codeBlock?: { hide?: boolean };
		blockquote?: { hide?: boolean };
		horizontalRule?: { hide?: boolean };
	};
}

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

	const handleParagraphClick = (event: React.MouseEvent<HTMLButtonElement>) => {
		event.preventDefault();
		event.stopPropagation();
		editor.chain().focus().setParagraph().run();
	};

	const handleHeadingClick =
		(level: 1 | 2 | 3 | 4 | 5 | 6) => (event: React.MouseEvent<HTMLButtonElement>) => {
			event.preventDefault();
			event.stopPropagation();
			editor.chain().focus().toggleHeading({ level }).run();
		};

	const handleSetLinkClick = (event: React.MouseEvent<HTMLButtonElement>) => {
		event.preventDefault();
		event.stopPropagation();

		const previousUrl = editor.getAttributes('link').href;
		const url = window.prompt('full URL, e.g. https://www.example.com', previousUrl);

		if (!url?.trim()) {
			return;
		}

		try {
			const parsedUrl = new URL(url);
			editor.chain().focus().extendMarkRange('link').setLink({ href: parsedUrl.toString() }).run();
		} catch (error) {
			if (error instanceof Error) {
				alert('Please enter a valid full URL, e.g. https://www.example.com');
				console.error(error);
			}
		}
	};

	const handleUnsetLinkClick = (event: React.MouseEvent<HTMLButtonElement>) => {
		event.preventDefault();
		event.stopPropagation();
		editor.chain().focus().unsetLink().run();
	};

	const handleBulletListClick = (event: React.MouseEvent<HTMLButtonElement>) => {
		event.preventDefault();
		event.stopPropagation();
		editor.chain().focus().toggleBulletList().run();
	};

	const handleOrderedListClick = (event: React.MouseEvent<HTMLButtonElement>) => {
		event.preventDefault();
		event.stopPropagation();
		editor.chain().focus().toggleOrderedList().run();
	};

	const handleCodeBlockClick = (event: React.MouseEvent<HTMLButtonElement>) => {
		event.preventDefault();
		event.stopPropagation();
		editor.chain().focus().toggleCodeBlock().run();
	};

	const handleBlockquoteClick = (event: React.MouseEvent<HTMLButtonElement>) => {
		event.preventDefault();
		event.stopPropagation();
		editor.chain().focus().toggleBlockquote().run();
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
		<div>
			<div className={styles.buttonGroup}>
				{!options.bold?.hide && (
					<button
						onClick={handleBoldClick}
						disabled={!editor.can().chain().focus().toggleBold().run()}
						className={editor.isActive('bold') ? styles.isActive : ''}
					>
						Bold
					</button>
				)}
				{!options.italic?.hide && (
					<button
						onClick={handleItalicClick}
						disabled={!editor.can().chain().focus().toggleItalic().run()}
						className={editor.isActive('italic') ? styles.isActive : ''}
					>
						Italic
					</button>
				)}
				{!options.strike?.hide && (
					<button
						onClick={handleStrikeClick}
						disabled={!editor.can().chain().focus().toggleStrike().run()}
						className={editor.isActive('strike') ? styles.isActive : ''}
					>
						Strike
					</button>
				)}
				{!options.code?.hide && (
					<button
						onClick={handleCodeClick}
						disabled={!editor.can().chain().focus().toggleCode().run()}
						className={editor.isActive('code') ? styles.isActive : ''}
					>
						Code
					</button>
				)}
			</div>

			<div className={styles.buttonGroup}>
				<button
					onClick={handleParagraphClick}
					className={editor.isActive('paragraph') ? styles.isActive : ''}
				>
					Paragraph
				</button>
				{!options.h1?.hide && (
					<button
						onClick={handleHeadingClick(1)}
						className={editor.isActive('heading', { level: 1 }) ? styles.isActive : ''}
					>
						H1
					</button>
				)}
				{!options.h2?.hide && (
					<button
						onClick={handleHeadingClick(2)}
						className={editor.isActive('heading', { level: 2 }) ? styles.isActive : ''}
					>
						H2
					</button>
				)}
				{!options.h3?.hide && (
					<button
						onClick={handleHeadingClick(3)}
						className={editor.isActive('heading', { level: 3 }) ? styles.isActive : ''}
					>
						H3
					</button>
				)}
				{!options.h4?.hide && (
					<button
						onClick={handleHeadingClick(4)}
						className={editor.isActive('heading', { level: 4 }) ? styles.isActive : ''}
					>
						H4
					</button>
				)}
				{!options.h5?.hide && (
					<button
						onClick={handleHeadingClick(5)}
						className={editor.isActive('heading', { level: 5 }) ? styles.isActive : ''}
					>
						H5
					</button>
				)}
				{!options.h6?.hide && (
					<button
						onClick={handleHeadingClick(6)}
						className={editor.isActive('heading', { level: 6 }) ? styles.isActive : ''}
					>
						H6
					</button>
				)}
			</div>

			{!options.link?.hide && (
				<div className={styles.buttonGroup}>
					<button onClick={handleSetLinkClick} disabled={editor.view.state.selection.empty}>
						Set link
					</button>
					<button onClick={handleUnsetLinkClick} disabled={!editor.isActive('link')}>
						Unset link
					</button>
				</div>
			)}

			<div className={styles.buttonGroup}>
				{!options.bulletList?.hide && (
					<button
						onClick={handleBulletListClick}
						className={editor.isActive('bulletList') ? styles.isActive : ''}
					>
						Bullet list
					</button>
				)}
				{!options.orderedList?.hide && (
					<button
						onClick={handleOrderedListClick}
						className={editor.isActive('orderedList') ? styles.isActive : ''}
					>
						Ordered list
					</button>
				)}
			</div>

			<div className={styles.buttonGroup}>
				{!options.codeBlock?.hide && (
					<button
						onClick={handleCodeBlockClick}
						className={editor.isActive('codeBlock') ? styles.isActive : ''}
					>
						Code block
					</button>
				)}
				{!options.blockquote?.hide && (
					<button
						onClick={handleBlockquoteClick}
						className={editor.isActive('blockquote') ? styles.isActive : ''}
					>
						Blockquote
					</button>
				)}
				{!options.horizontalRule?.hide && (
					<button onClick={handleHorizontalRuleClick}>Horizontal rule</button>
				)}
			</div>

			<div className={styles.buttonGroup}>
				<button onClick={handleUndoClick} disabled={!editor.can().chain().focus().undo().run()}>
					Undo
				</button>
				<button onClick={handleRedoClick} disabled={!editor.can().chain().focus().redo().run()}>
					Redo
				</button>
			</div>
		</div>
	);
};
