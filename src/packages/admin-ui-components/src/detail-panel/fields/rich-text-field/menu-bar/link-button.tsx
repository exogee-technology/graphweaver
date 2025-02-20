import { SectionProps } from './utils';
import { EditorLinkIcon, EditorUnlinkIcon } from '../../../../assets';
import styles from './styles.module.css';

export const LinkButton = (props: SectionProps) => {
	const { editor, options } = props;

	const handleSetLinkClick = (event: React.MouseEvent<HTMLButtonElement>) => {
		event.preventDefault();
		event.stopPropagation();

		const previousUrl = editor.getAttributes('link').href;
		const url = window.prompt(
			'Please enter the full URL address, e.g. https://www.example.com or mailto:example@gmail.com or tel:+1234567890',
			previousUrl
		);

		if (!url?.trim()) {
			return;
		}

		try {
			const parsedUrl = new URL(url);
			editor.chain().focus().extendMarkRange('link').setLink({ href: parsedUrl.toString() }).run();
		} catch (error) {
			if (error instanceof Error) {
				alert(
					'The URL entered is not valid, Please enter a valid full URL including the protocol, for example: https://www.example.com or mailto:example@gmail.com or tel:+1234567890'
				);
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
			<button
				onClick={handleUnsetLinkClick}
				className={styles.isActive}
				title={`unlink ${editor.getAttributes('link').href}`}
			>
				<EditorUnlinkIcon />
			</button>
		);
	}

	return (
		<button onClick={handleSetLinkClick} disabled={editor.view.state.selection.empty} title="link">
			<EditorLinkIcon />
		</button>
	);
};
