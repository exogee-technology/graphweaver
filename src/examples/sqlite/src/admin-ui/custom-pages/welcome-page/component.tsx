import {
	Arrow,
	Button,
	Spacer,
	WelcomePage as WelcomePageLayout,
} from '@exogee/graphweaver-admin-ui-components';
import styles from './styles.module.css';

export const WelcomePage = () => (
	<WelcomePageLayout skipPath="/Album">
		<Spacer height={30} />
		<h2 className={styles.heading}>SQLite Example</h2>
		<Spacer height={30} />
		<p>
			This example shows how to query an SQLite database with Graphweaver and how to use our OTEL
			compatible tracing framework. The database here is{' '}
			<a href="https://github.com/lerocha/chinook-database">Chinook</a> with the tracing table
			added.
		</p>
		<Spacer height={10} />
		<p>
			If you're stuck,{' '}
			<a
				href="https://join.slack.com/t/graphweaver/shared_invite/zt-2hxeb04d3-reNTqeVUAWy2YVXWscWRaw"
				target="_blank"
				rel="noopener noreferrer"
			>
				reach out to us on Slack
			</a>
			. We're here to help!
		</p>
		<Spacer height={30} />
		<Button className={styles.button} href="/Album">
			Get started! <Arrow className={styles.arrow} />
		</Button>
	</WelcomePageLayout>
);
