import { useMemo, useState } from 'react';
import { Editor, useCurrentEditor } from '@tiptap/react';
import {
	EditorBoldIcon,
	EditorCodeBlockIcon,
	EditorCodeIcon,
	EditorH1Icon,
	EditorH2Icon,
	EditorH3Icon,
	EditorH4Icon,
	EditorH5Icon,
	EditorH6Icon,
	EditorHIcon,
	EditorItalicIcon,
	EditorLinkIcon,
	EditorOrderedListIcon,
	EditorPIcon,
	EditorBlockquoteIcon,
	EditorRedoIcon,
	EditorSeparatorIcon,
	EditorStrikeIcon,
	EditorUndoIcon,
	EditorUnlinkIcon,
	EditorUnOrderedListIcon,
} from '../../../assets';
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
		unorderedList?: { hide?: boolean };
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

interface SectionProps {
	editor: Editor;
	options: Props['options'];
}

const HeaderOptions = (props: SectionProps) => {
	const { editor, options } = props;
	const [showItems, setShowItems] = useState(false);

	const show = useMemo(() => {
		return {
			h1: !options.h1?.hide,
			h2: !options.h2?.hide,
			h3: !options.h3?.hide,
			h4: !options.h4?.hide,
			h5: !options.h5?.hide,
			h6: !options.h6?.hide,
		};
	}, [options]);

	const handleHeadingClick =
		(level: 1 | 2 | 3 | 4 | 5 | 6) => (event: React.MouseEvent<HTMLButtonElement>) => {
			event.preventDefault();
			event.stopPropagation();
			editor.chain().focus().toggleHeading({ level }).run();
		};

	const handleParagraphClick = (event: React.MouseEvent<HTMLButtonElement>) => {
		event.preventDefault();
		event.stopPropagation();
		editor.chain().focus().setParagraph().run();
	};

	return (
		<div onMouseEnter={() => setShowItems(true)} onMouseLeave={() => setShowItems(false)}>
			{show.h1 ? (
				<button
					onClick={handleHeadingClick(1)}
					className={
						editor.isActive('paragraph') || editor.isActive('heading') ? styles.isActive : ''
					}
				>
					<EditorHIcon />
				</button>
			) : (
				<button
					onClick={handleParagraphClick}
					className={editor.isActive('paragraph') ? styles.isActive : ''}
				>
					<EditorPIcon />
				</button>
			)}
			{showItems && (
				<div className={styles.itemsContainer}>
					<button
						onClick={handleParagraphClick}
						className={editor.isActive('paragraph') ? styles.isActive : ''}
					>
						<EditorPIcon />
					</button>
					{show.h1 && (
						<button
							onClick={handleHeadingClick(1)}
							className={editor.isActive('heading', { level: 1 }) ? styles.isActive : ''}
						>
							<EditorH1Icon />
						</button>
					)}
					{show.h2 && (
						<button
							onClick={handleHeadingClick(2)}
							className={editor.isActive('heading', { level: 2 }) ? styles.isActive : ''}
						>
							<EditorH2Icon />
						</button>
					)}
					{show.h3 && (
						<button
							onClick={handleHeadingClick(3)}
							className={editor.isActive('heading', { level: 3 }) ? styles.isActive : ''}
						>
							<EditorH3Icon />
						</button>
					)}
					{show.h4 && (
						<button
							onClick={handleHeadingClick(4)}
							className={editor.isActive('heading', { level: 4 }) ? styles.isActive : ''}
						>
							<EditorH4Icon />
						</button>
					)}
					{show.h5 && (
						<button
							onClick={handleHeadingClick(5)}
							className={editor.isActive('heading', { level: 5 }) ? styles.isActive : ''}
						>
							<EditorH5Icon />
						</button>
					)}
					{show.h6 && (
						<button
							onClick={handleHeadingClick(6)}
							className={editor.isActive('heading', { level: 6 }) ? styles.isActive : ''}
						>
							<EditorH6Icon />
						</button>
					)}
				</div>
			)}
		</div>
	);
};

const ListOptions = (props: SectionProps) => {
	const { editor, options } = props;
	const [showItems, setShowItems] = useState(false);

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

	const handleBlockquoteClick = (event: React.MouseEvent<HTMLButtonElement>) => {
		event.preventDefault();
		event.stopPropagation();
		editor.chain().focus().toggleBlockquote().run();
	};

	const getMainAndOptionButtons = () => {
		const buttons = {
			unorderedList: !options.unorderedList?.hide && (
				<button
					key={1}
					onClick={handleBulletListClick}
					className={editor.isActive('bulletList') ? styles.isActive : ''}
				>
					<EditorUnOrderedListIcon />
				</button>
			),
			orderedList: !options.orderedList?.hide && (
				<button
					key={2}
					onClick={handleOrderedListClick}
					className={editor.isActive('orderedList') ? styles.isActive : ''}
				>
					<EditorOrderedListIcon />
				</button>
			),
			blockquote: !options.blockquote?.hide && (
				<button
					key={3}
					onClick={handleBlockquoteClick}
					className={editor.isActive('blockquote') ? styles.isActive : ''}
				>
					<EditorBlockquoteIcon />
				</button>
			),
		};

		const mainButton = buttons.unorderedList || buttons.orderedList || buttons.blockquote;

		if (!mainButton) {
			return [undefined, []] as const;
		}

		const optionButtons = Object.values(buttons).filter((button) => button && button != mainButton);

		return [mainButton, optionButtons] as const;
	};

	const [mainButton, optionButtons] = getMainAndOptionButtons();

	if (!mainButton) return null;

	return (
		<div onMouseEnter={() => setShowItems(true)} onMouseLeave={() => setShowItems(false)}>
			{mainButton}
			{showItems && <div className={styles.itemsContainer}>{optionButtons}</div>}
		</div>
	);
};

const LinkButton = (props: SectionProps) => {
	const { editor, options } = props;

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

	if (options.link?.hide) return null;

	if (editor.isActive('link')) {
		return (
			<button onClick={handleUnsetLinkClick} className={styles.isActive}>
				<EditorUnlinkIcon />
			</button>
		);
	}

	return (
		<button onClick={handleSetLinkClick} disabled={editor.view.state.selection.empty}>
			<EditorLinkIcon />
		</button>
	);
};
