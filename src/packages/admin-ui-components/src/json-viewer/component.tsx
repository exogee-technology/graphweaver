import { CodeBlock, atomOneDark } from 'react-code-blocks';

export const JsonViewer = ({ text }: { text: string | Record<string, unknown> }) => {
	return (
		<CodeBlock
			text={typeof text === 'string' ? text : JSON.stringify(text, null, 2)}
			language="json"
			showLineNumbers={true}
			theme={atomOneDark}
			customStyle={{
				backgroundColor: '#14111a',
				height: '100%',
				overflowY: 'auto',
				flex: '1',
			}}
		/>
	);
};
