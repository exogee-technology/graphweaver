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
		<h2 className={styles.heading}>Auth0 Example</h2>
		<Spacer height={30} />
		<p>This example shows how to use Auth0 as your authentication provider with Graphweaver.</p>
		<Spacer height={20} />
		<p>
			The principles shown here can be used to use any external authentication provider with
			Graphweaver, but we've built specific components to make it especially easy to use Auth0.
		</p>
		<Spacer height={10} />
		<p>The main components that you need on your frontend are:</p>
		<Spacer height={10} />
		<ul className={styles.list}>
			<li>
				Code that recognises the X-Auth-Redirect header and follows it when sent from the backend.
			</li>
			<li>A receiving page to get the token back from Auth0.</li>
			<li>Components to handle login and logout.</li>
			<li>
				These are already configured for the Admin UI in this project. You can use the Admin UI
				components in your project if it suits you, or you can create similar components separately.
			</li>
		</ul>
		<Spacer height={10} />
		<p>The main components that you need on your backend are:</p>
		<Spacer height={10} />
		<ul className={styles.list}>
			<li>
				Code that will return the X-Auth-Redirect header to the frontend when the user is not
				authenticated.
			</li>
			<li>Code that will map the token to the user groups that the user should have.</li>
			<li>
				These are already configured in this project. Check the backend/auth folder and
				backend/index.ts file for more info.
			</li>
		</ul>
		<Spacer height={10} />
		<p>
			To get started, copy the .env.example file to just .env, add the values you get from the Auth0
			console then run pnpm start. If you're getting a 500 error from your backend, the most likely
			cause is that you haven't set up the Auth0 values correctly.
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
		<Button className={styles.button} href="/Album">
			Get started! <Arrow className={styles.arrow} />
		</Button>
	</WelcomePageLayout>
);
