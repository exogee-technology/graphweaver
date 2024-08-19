import {
	Arrow,
	Button,
	Spacer,
	WelcomePage as WelcomePageLayout,
} from '@exogee/graphweaver-admin-ui-components';
import { PrismLight as SyntaxHighlighter } from 'react-syntax-highlighter';
import ts from 'react-syntax-highlighter/dist/esm/languages/prism/typescript';
import theme from 'react-syntax-highlighter/dist/esm/styles/prism/coldark-dark';

import styles from './styles.module.css';

SyntaxHighlighter.registerLanguage('typescript', ts);

export const WelcomePage = () => (
	<WelcomePageLayout skipPath="/Submission">
		<Spacer height={30} />
		<h2 className={styles.heading}>S3 Storage Example</h2>
		<Spacer height={30} />
		<p>This example shows how to store media in AWS S3 with Graphweaver.</p>
		<Spacer height={20} />
		<p>
			Graphweaver supports adding media fields to your entities. This allows you to store images,
			videos, etc. The media in these fields is uploaded to S3 via a signed URL, and the resulting
			location is passed to the backend in a mutation.
		</p>
		<Spacer height={10} />
		<p> The underlying storage in the database is in PostgreSQL in a JSON field:</p>
		<SyntaxHighlighter
			language="typescript"
			style={theme}
			showLineNumbers
			customStyle={{ background: 'hsl(264, 40%, 10%)' }}
		>
			{`import { BigIntType, Entity, PrimaryKey, Property } from '@mikro-orm/core';

@Entity()
export class Submission {
	@PrimaryKey({ type: new BigIntType('string') })
	id!: string;

	@Property({ type: 'json', nullable: true })
	image?: { filename: string; type: string };
}`}
		</SyntaxHighlighter>
		<p>
			We need a storage provider which tells the backend what credentials we want to use, what
			bucket to put the files in, etc:
		</p>
		<Spacer height={10} />
		<SyntaxHighlighter
			language="typescript"
			style={theme}
			showLineNumbers
			customStyle={{ background: 'hsl(264, 40%, 10%)' }}
		>
			{`const s3 = new S3StorageProvider({
	bucketName: process.env.AWS_S3_BUCKET,
	region: process.env.AWS_REGION,
	type: StorageType.S3,
	expiresIn: 3600,
	endpoint: process.env.AWS_S3_ENDPOINT,
});`}
		</SyntaxHighlighter>
		<p>Then we can configure our media field:</p>
		<SyntaxHighlighter
			language="typescript"
			style={theme}
			showLineNumbers
			customStyle={{ background: 'hsl(264, 40%, 10%)' }}
		>
			{`@Entity('Submission', {
	provider: new MikroBackendProvider(OrmSubmission, pgConnection),
})
export class Submission {
	@Field(() => ID)
	id!: string;

	@MediaField({ storageProvider: s3 })
	image?: Media;
}`}
		</SyntaxHighlighter>
		<p>
			This creates a query that will generate a signed URL, and a mutation to accept the result once
			S3 has accepted the file upload from the client. Ready to have a look?
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
		<Button className={styles.button} href="/Submission">
			Get started! <Arrow className={styles.arrow} />
		</Button>
	</WelcomePageLayout>
);
