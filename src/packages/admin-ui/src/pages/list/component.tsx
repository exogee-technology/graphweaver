import { Await, useLoaderData } from 'react-router-dom';
import { Table, Button, FilterButton } from '~/components';
import { ReactComponent as OpenPlaygroundIcon } from '~/assets/16-open-external.svg';
import { ReactComponent as FilterIcon } from '~/assets/16-filter.svg';

import { ListLoader } from './loader';
import styles from './styles.module.css';
import React from 'react';
import { ApolloQueryResult } from '@apollo/client';
import { DetailPanel } from '~/components/detail-panel';

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
					<OpenPlaygroundIcon />
				</span>
			</Button>
			<Button
				dropdown
				dropdownItems={[
					{ name: 'Add links array', href: 'some_url' },
					{ name: 'Add links array', href: 'some_url' },
				]}
				iconBefore={<OpenPlaygroundIcon />}
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

				<React.Suspense fallback={<p>Loading...</p>}>
					<Await resolve={rows} errorElement={<p>Error!</p>}>
						{(rows: ApolloQueryResult<{ result: Array<{ id: string }> }>) => (
							<>
								<Table rows={rows.data.result} />
							</>
						)}
					</Await>
				</React.Suspense>
			</div>
			<DetailPanel />
		</>
	);
};
