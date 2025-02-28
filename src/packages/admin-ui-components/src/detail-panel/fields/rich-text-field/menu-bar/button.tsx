import { useCurrentEditor } from '@tiptap/react';
import { editorClickHandler } from './utils';
import styles from './styles.module.css';

interface Props {
	hide?: boolean;
	command: () => boolean;
	activeWhen?: string;
	activeWhenAttributes?: Record<string, unknown>;
	Icon: React.ReactNode;
	disabled?: boolean;
	title: string;
}

export const Button = (props: Props) => {
	const { command, activeWhen, Icon, hide, disabled, activeWhenAttributes, title } = props;
	const { editor } = useCurrentEditor();

	if (!editor || hide) return null;

	const className =
		activeWhen && editor.isActive(activeWhen, activeWhenAttributes) ? styles.isActive : undefined;

	return (
		<button
			onClick={editorClickHandler(command)}
			className={className}
			disabled={disabled}
			title={title}
		>
			{Icon}
		</button>
	);
};
