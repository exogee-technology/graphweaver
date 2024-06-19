import { CodeBlock, atomOneDark } from 'react-code-blocks';

export const GraphQlEditor = () => {
	const graphql = `query {
  tasks {
    id
    description
    user {
      id
      name
    }
      id
    description
    user {
      id
      name
    }
      id
    description
    user {
      id
      name
    }
      id
    description
    user {
      id
      name
    }
      id
    description
    user {
      id
      name
    }
      id
    description
    user {
      id
      name
    }
  }
}`;
	return (
		<CodeBlock
			text={graphql}
			language="graphql"
			showLineNumbers={true}
			theme={atomOneDark}
			customStyle={{
				backgroundColor: '#14111a',
				height: '40%',
				overflow: 'scroll',
				flex: '1',
			}}
		/>
	);
};
