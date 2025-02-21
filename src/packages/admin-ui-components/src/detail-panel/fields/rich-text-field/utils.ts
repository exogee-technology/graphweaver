import Link from '@tiptap/extension-link';
import StarterKit from '@tiptap/starter-kit';
import { Markdown } from 'tiptap-markdown';

export const getExtensions = ({ asMarkdown }: { asMarkdown?: boolean }) => {
	return [
		StarterKit.configure({
			bulletList: {
				keepMarks: true,
				keepAttributes: false,
			},
			orderedList: {
				keepMarks: true,
				keepAttributes: false,
			},
		}),
		Link.configure({
			HTMLAttributes: {
				rel: 'noopener noreferrer',
				target: '_blank',
			},
			openOnClick: false,
		}),
		...(asMarkdown
			? [
					Markdown.configure({
						html: true,
						linkify: true,
						transformPastedText: true,
					}),
				]
			: []),
	];
};
