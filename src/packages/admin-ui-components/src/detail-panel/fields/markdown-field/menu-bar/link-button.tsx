import { SectionProps } from './utils';
import { EditorLinkIcon, EditorUnlinkIcon } from '../../../../assets';
import styles from './styles.module.css';

export const LinkButton = (props: SectionProps) => {
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
