import {
	Arrow,
	Button,
	Spacer,
	WelcomePage as WelcomePageLayout,
} from '@exogee/graphweaver-admin-ui-components';
import styles from './styles.module.css';

export const WelcomePage = () => (
	<WelcomePageLayout skipPath="/Account">
		<Spacer height={30} />
		<h2 className={styles.heading}>Xero Example</h2>
		<Spacer height={30} />
		<p>
			This example shows how to authenticate with Xero and query the Xero API with Graphweaver. It
			also adds some custom dashboards which plot the data using Nivo.
		</p>
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
		<Button className={styles.button} href="/Account">
			Get started! <Arrow className={styles.arrow} />
		</Button>
	</WelcomePageLayout>
);
