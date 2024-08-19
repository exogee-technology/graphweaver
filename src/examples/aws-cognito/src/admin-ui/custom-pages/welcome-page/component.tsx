import {
	Arrow,
	Button,
	Spacer,
	WelcomePage as WelcomePageLayout,
} from '@exogee/graphweaver-admin-ui-components';
import styles from './styles.module.css';

export const WelcomePage = () => (
	<WelcomePageLayout skipPath="/CognitoUser">
		<Spacer height={30} />
		<h2 className={styles.heading}>AWS Cognito Example</h2>
		<Spacer height={30} />
		<p>This example shows how to allow user creation / editing with Graphweaver and AWS Cognito.</p>
		<Spacer height={10} />
		<p>
			To get started, copy the .env.example file to just .env, add the values you get from the AWS
			console then run pnpm start. If you're getting a 500 error from your backend, the most likely
			cause is that you haven't set up the AWS values correctly.
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
		<Button className={styles.button} href="/CognitoUser">
			Get started! <Arrow className={styles.arrow} />
		</Button>
	</WelcomePageLayout>
);
