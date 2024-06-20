import { CodeBlock, atomOneDark } from 'react-code-blocks';

export const GraphQlViewer = ({ graphql }: { graphql: string }) => {
	return (
		<CodeBlock
			text={graphql}
			language="graphql"
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
