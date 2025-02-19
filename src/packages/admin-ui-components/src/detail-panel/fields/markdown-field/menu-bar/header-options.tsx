import { useMemo, useState } from 'react';
import {
	EditorH1Icon,
	EditorH2Icon,
	EditorH3Icon,
	EditorH4Icon,
	EditorH5Icon,
	EditorH6Icon,
	EditorHIcon,
	EditorPIcon,
} from '../../../../assets';
import styles from './styles.module.css';
import { SectionProps } from './utils';

export const HeaderOptions = (props: SectionProps) => {
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
					className={editor.isActive('heading') ? styles.isActive : ''}
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
