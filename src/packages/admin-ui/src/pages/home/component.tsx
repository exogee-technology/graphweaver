import { useState } from 'react';

import { SideBar, Table, Button, FilterButton } from '~/components';
import mockData from '~/utils/mock-data.json';

import styles from './styles.module.css';
import { ReactComponent as DataSourcesIcon } from '~/assets/64-data-sources.svg';
import { ReactComponent as OpenPlaygroundIcon } from '~/assets/16-open-external.svg';
import { ReactComponent as FilterIcon } from '~/assets/16-filter.svg';

const BlankSlate = () => (
	<div id={styles.centerBlankSlate}>
		<div className={styles.blankSlateWrapper}>
			<DataSourcesIcon />
			<h1>No data sources yet</h1>

			<p className="subtext">
				Connect data sources. See the <a href="/#">readme</a> for more details
			</p>
		</div>
	</div>
);

const ToolBar = () => (
	<div className={styles.toolBarWrapper}>
		<div className="titleWrapper">
			<h1>endpoint</h1>
			<p className="subtext">somedomain.com/api/endpoint</p>
		</div>

		<div className={styles.toolsWrapper}>
			<input className={styles.search} type="search" name="search" placeholder="Search..." />
			<FilterButton dropdown={true} iconBefore={<FilterIcon />}>
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

const MainScreen = () => (
	<>
		<SideBar />
		<div className={styles.content}>
			<ToolBar />
			<Table />
		</div>
	</>
);

export const Home = ({ hasData }: { hasData: boolean }) => (
	<div className={styles.wrapper}>{hasData ? <MainScreen /> : <BlankSlate />}</div>
);
