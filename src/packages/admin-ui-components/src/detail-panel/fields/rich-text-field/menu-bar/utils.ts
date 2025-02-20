import { ChainedCommands, Editor } from '@tiptap/react';

export interface Props {
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

export interface SectionProps {
	editor: Editor;
	options: Props['options'];
}

export const editorClickHandler =
	(command: ChainedCommands) => (event: React.MouseEvent<HTMLButtonElement>) => {
		event.preventDefault();
		event.stopPropagation();
		command.run();
	};
