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
import { Button } from './button';

export const HeaderOptions = (props: SectionProps) => {
	const { editor, options } = props;

	const hCommand = (level: 1 | 2 | 3 | 4 | 5 | 6) => {
		return () => editor.chain().focus().toggleHeading({ level }).run();
	};

	const hOptionButtons = ([1, 2, 3, 4, 5, 6] as const)
		.map((level) => {
			const hide = options[`h${level}`]?.hide;
			if (hide) return null;

			return (
				<Button
					key={level}
					hide={hide}
					command={hCommand(level)}
					Icon={<EditorHNIcon level={level} />}
					activeWhen="heading"
					activeWhenAttributes={{ level }}
					title={`Heading ${level}`}
				/>
			);
		})
		.filter(Boolean);

	const pButton = (
		<Button
			key="p"
			command={() => editor.chain().focus().setParagraph().run()}
			Icon={<EditorPIcon />}
			activeWhen="paragraph"
			title="Paragraph"
		/>
	);

	// The main button is either a generic H or a P button
	const mainButton =
		hOptionButtons.length > 0 ? (
			<Button
				command={hCommand(hOptionButtons[0]?.props.level)}
				Icon={<EditorHIcon />}
				activeWhen="heading"
				title="Heading"
			/>
		) : (
			pButton
		); // Note that this is a button with a generic H icon and is active when any H is active

	// If no H options to show then no option buttons needed, otherwise we show [P, H1-H6] buttons
	const optionButtons = hOptionButtons[0] ? [pButton, ...hOptionButtons] : [];

	return (
		<div className={styles.multiButtonContainer}>
			{mainButton}
			{optionButtons.length > 0 && <div className={styles.itemsContainer}>{optionButtons}</div>}
		</div>
	);
};

const EditorHNIcon = ({ level }: { level: 1 | 2 | 3 | 4 | 5 | 6 }) => {
	return {
		1: <EditorH1Icon />,
		2: <EditorH2Icon />,
		3: <EditorH3Icon />,
		4: <EditorH4Icon />,
		5: <EditorH5Icon />,
		6: <EditorH6Icon />,
	}[level];
};
