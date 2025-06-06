import {
	Arrow,
	Button,
	Spacer,
	WelcomePage as WelcomePageLayout,
} from '@exogee/graphweaver-admin-ui-components';
import { PrismLight as SyntaxHighlighter } from 'react-syntax-highlighter';
import graphql from 'react-syntax-highlighter/dist/esm/languages/prism/graphql';
import theme from 'react-syntax-highlighter/dist/esm/styles/prism/coldark-dark';
import styles from './styles.module.css';

SyntaxHighlighter.registerLanguage('graphql', graphql);

export const WelcomePage = () => (
	<WelcomePageLayout skipPath="/User">
		<Spacer height={30} />
		<h2 className={styles.heading}>MySQL / PostgreSQL Example</h2>
		<Spacer height={30} />
		<p>This example shows how to join two databases.</p>
		<Spacer height={20} />
		<ul className={styles.list}>
			<li>MySQL: This database contains tasks which can be assigned to users.</li>
			<li>PostgreSQL: This database contains users which can be have tasks assigned to them.</li>
		</ul>
		<Spacer height={20} />
		<p>
			This is useful to demonstrate how cross datasource filtering works. For example, when you run
			this query:
		</p>
		<SyntaxHighlighter
			language="graphql"
			style={theme}
			showLineNumbers
			customStyle={{ background: 'hsl(264, 40%, 10%)' }}
		>
			{`query CrossDatasourceFiltering {
    tasks(filter: {user: {username_in: ["mike_jones", "jane_smith"]}}) {
        description
        user {
        	username
        }
    }
}`}
		</SyntaxHighlighter>
		<p>
			Graphweaver does something really special. It will go to the Postgres database, find user IDs
			matching the filter, then go to the MySQL database and find tasks where the user ID is one of
			the ones in the array from Postgres. It does this all just because you've specified that
			there's a relationship between these two entities that live in different data providers.
		</p>
		<Spacer height={10} />
		<p>Graphweaver can do this for all of your data sources!</p>
		<Spacer height={10} />
		<p>
			If you're stuck,{' '}
			<a
				href="https://join.slack.com/t/graphweaver/shared_invite/zt-2hxeb04d3-reNTqeVUAWy2YVXWscWRaw"
				target="_blank"
				rel="noopener noreferrer"
			>
				reach out to us on Slack.
			</a>{' '}
			We're here to help!
		</p>
		<Spacer height={30} />
		<Button className={styles.button} href="/User">
			Get started! <Arrow className={styles.arrow} />
		</Button>
	</WelcomePageLayout>
);
