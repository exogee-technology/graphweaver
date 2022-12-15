import React from 'react';
import { Await, useLoaderData } from 'react-router-dom';
import { ApolloQueryResult } from '@apollo/client';
import {
	Button,
	DetailPanel,
	FilterButton,
	FilterIcon,
	Loader,
	OpenExternalIcon,
	Table,
} from '@exogee/graphweaver-admin-ui-components';

import '@exogee/graphweaver-admin-ui-components/lib/index.css';
import styles from './styles.module.css';

// const BlankSlate = () => (
// 	<div id={styles.centerBlankSlate}>
// 		<div className={styles.blankSlateWrapper}>
// 			<DataSourcesIcon />
// 			<h1>No data sources yet</h1>

// 			<p className="subtext">
// 				Connect data sources. See the <a href="/#">readme</a> for more details
// 			</p>
// 		</div>
// 	</div>
// );

const ToolBar = () => (
	<div className={styles.toolBarWrapper}>
		<div className="titleWrapper">
			<h1>localhost</h1>
			<p className="subtext">localhost:3000/graphql/v1</p>
		</div>

		<div className={styles.toolsWrapper}>
			<input className={styles.search} type="search" name="search" placeholder="Search..." />
			<FilterButton dropdown iconBefore={<FilterIcon />}>
				Filter
			</FilterButton>

			<Button>
				<p>Open playground</p>
				<span>
					<OpenExternalIcon />
				</span>
			</Button>
			<Button
				dropdown
				dropdownItems={[
					{ name: 'Add links array', href: 'some_url' },
					{ name: 'Add links array', href: 'some_url' },
				]}
				iconBefore={<OpenExternalIcon />}
			>
				Test
			</Button>
		</div>
	</div>
);

export const List = () => {
	const { rows } = useLoaderData() as { rows: any };

	return (
		<>
			<div className={styles.mainContent}>
				<ToolBar />

				<React.Suspense fallback={<Loader />}>
					<Await resolve={rows} errorElement={<p>Error!</p>}>
						{(rows: ApolloQueryResult<{ result: Array<{ id: string }> }>) => (
							<Table rows={rows.data.result} />
						)}
					</Await>
				</React.Suspense>
			</div>
			<DetailPanel />
		</>
	);
};
