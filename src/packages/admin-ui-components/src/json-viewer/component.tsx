import { PrismLight as SyntaxHighlighter } from 'react-syntax-highlighter';
import json from 'react-syntax-highlighter/dist/esm/languages/prism/json';
import theme from 'react-syntax-highlighter/dist/esm/styles/prism/coldark-dark';

SyntaxHighlighter.registerLanguage('json', json);

export const JsonViewer = ({ text }: { text: string | Record<string, unknown> }) => {
	return (
		<SyntaxHighlighter
			language="json"
			showLineNumbers
			style={theme}
			customStyle={{
				backgroundColor: '#14111a',
				height: '100%',
				overflowY: 'auto',
				flex: '1',
			}}
		>
			{typeof text === 'string' ? text : JSON.stringify(text, null, 2)}
		</SyntaxHighlighter>
	);
};
