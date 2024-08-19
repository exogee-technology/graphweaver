import { PrismLight as SyntaxHighlighter } from 'react-syntax-highlighter';
import graphql from 'react-syntax-highlighter/dist/esm/languages/prism/graphql';
import theme from 'react-syntax-highlighter/dist/esm/styles/prism/coldark-dark';

SyntaxHighlighter.registerLanguage('graphql', graphql);

export const GraphQlViewer = ({ graphql }: { graphql: string }) => {
	return (
		<SyntaxHighlighter
			language="graphql"
			showLineNumbers
			style={theme}
			customStyle={{
				backgroundColor: '#14111a',
				height: '100%',
				overflowY: 'auto',
				flex: '1',
			}}
		>
			{graphql}
		</SyntaxHighlighter>
	);
};
