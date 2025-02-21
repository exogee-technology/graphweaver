import {
	EditorOrderedListIcon,
	EditorBlockquoteIcon,
	EditorUnOrderedListIcon,
} from '../../../../assets';
import { SectionProps } from './utils';
import { Button } from './button';
import styles from './styles.module.css';

export const ListOptions = (props: SectionProps) => {
	const { editor, options } = props;

	const buttons = [
		<Button
			key={1}
			hide={options.unorderedList?.hide}
			command={editor.chain().focus().toggleBulletList()}
			activeWhen="bulletList"
			Icon={<EditorUnOrderedListIcon />}
			title="Unordered List"
		/>,

		<Button
			key={2}
			hide={options.orderedList?.hide}
			command={editor.chain().focus().toggleOrderedList()}
			activeWhen="orderedList"
			Icon={<EditorOrderedListIcon />}
			title="Ordered List"
		/>,

		<Button
			key={3}
			hide={options.blockquote?.hide}
			command={editor.chain().focus().toggleBlockquote()}
			activeWhen="blockquote"
			Icon={<EditorBlockquoteIcon />}
			title="Blockquote"
		/>,
	].filter(Boolean);

	if (buttons.length === 0) return null;

	return (
		<div className={styles.multiButtonContainer}>
			{buttons[0]}
			{buttons.length > 1 && <div className={styles.itemsContainer}>{buttons}</div>}
		</div>
	);
};
