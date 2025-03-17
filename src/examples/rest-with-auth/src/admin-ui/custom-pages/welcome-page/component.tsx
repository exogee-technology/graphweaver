import {
	Arrow,
	Button,
	localStorageAuthKey,
	Spacer,
	WelcomePage as WelcomePageLayout,
} from '@exogee/graphweaver-admin-ui-components';
import { Redirect } from 'wouter';
import styles from './styles.module.css';

export const WelcomePage = () => {
	// This specific welcome page should pretend to need auth. There's nothing secret about this
	// content, but because it doesn't actually make any API calls, it would normally render.
	//
	// It's better for UX if we redirect to the login page instead.
	if (!localStorage.getItem(localStorageAuthKey)) {
		return <Redirect to={`/auth/login?redirect_uri=${encodeURI(window.location.href)}`} />;
	}

	return (
		<WelcomePageLayout skipPath="/User">
			<Spacer height={30} />
			<h2 className={styles.heading}>Rest + Full Auth Example</h2>
			<Spacer height={30} />
			<p>
				This example shows a MySQL database joined with a simple REST API with Graphweaver. Full
				auth / RBAC / multi-factor / etc is also demonstrated.
			</p>
			<Spacer height={20} />
			<p>
				In this example, there are two roles. Light side users are only able to see and manage their
				own tasks, while dark side users can see and manage all tasks. When creating a task, the
				application will prompt for step-up multifactor auth.
			</p>
			<Spacer height={20} />
			<p>
				To get started, copy the .env.example file to just .env, then follow the steps in the readme
				to generate your keys.
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
			<Button className={styles.button} href="/User">
				Get started! <Arrow className={styles.arrow} />
			</Button>
		</WelcomePageLayout>
	);
};
