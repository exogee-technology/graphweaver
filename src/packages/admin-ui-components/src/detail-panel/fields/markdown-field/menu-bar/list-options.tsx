import { useCallback, useMemo, useState } from 'react';
import {
	EditorOrderedListIcon,
	EditorBlockquoteIcon,
	EditorUnOrderedListIcon,
} from '../../../../assets';
import { SectionProps } from './utils';
import styles from './styles.module.css';

export const ListOptions = (props: SectionProps) => {
	const { editor, options } = props;
	const [showItems, setShowItems] = useState(false);

	const getMainAndOptionButtons = useCallback(() => {
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
	}, [options, editor]);

	const [mainButton, optionButtons] = getMainAndOptionButtons();

	if (!mainButton) return null;

	return (
		<div onMouseEnter={() => setShowItems(true)} onMouseLeave={() => setShowItems(false)}>
			{mainButton}
			{showItems && <div className={styles.itemsContainer}>{optionButtons}</div>}
		</div>
	);
};
