import { CodeBlock, dracula } from 'react-code-blocks';
import { Arrow, Button, GraphweaverLogo, StarField } from '@exogee/graphweaver-admin-ui-components';
import styles from './styles.module.css';

export const WelcomePage = () => (
	<div className={styles.wrapper}>
		<div className={styles.leftPanel}>
			<GraphweaverLogo className={styles.logo} />
			<h2 className={styles.heading}>MySQL / PostgreSQL Example</h2>
			<p className={styles.text}>This example shows how to join two databases.</p>
			<ul className={styles.list}>
				<li>MySQL: This database contains tasks which can be assigned to users.</li>
				<li>PostgreSQL: This database contains users which can be have tasks assigned to them.</li>
			</ul>
			<p className={styles.text}>
				This is useful to demonstrate how cross datasource filtering works. For example, when you
				run this query:
			</p>
			<CodeBlock
				showLineNumbers
				language="graphql"
				theme={dracula}
				customStyle={{ backgroundColor: 'hsl(264, 40%, 10%)', marginBottom: '1rem' }}
				codeContainerStyle={{}}
				text={`query CrossDatasourceFiltering {
    tasks(filter: {user: {username_in: ["mike_jones", "jane_smith"]}}) {
        description
        user {
        	username
        }
    }
}`}
			/>
			<p className={styles.text}>
				Graphweaver does something really special. It will go to the Postgres database, find user
				IDs matching the filter, then go to the MySQL database and find tasks where the user ID is
				one of the ones in the array from Postgres. It does this all just because you've specified
				that there's a relationship between these two entities that live in different data
				providers.
			</p>

			<p className={styles.text}>
				Graphweaver can do this for all of your data sources! Ready to have a look?
			</p>

			<Button className={styles.button} href="/User">
				Get started! <Arrow className={styles.arrow} />
			</Button>
		</div>
		<div className={styles.rightPanel}>
			<StarField />
		</div>
	</div>
);
