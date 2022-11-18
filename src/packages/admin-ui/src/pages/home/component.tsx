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

function ToolBar({
	updateTable,
	initialData,
}: {
	// tableData: Array<any>;
	updateTable: (update: Array<any>) => any;
	initialData: Array<any>;
}) {
	let timeOut: any;

	const handleChange = (e: any) => {
		clearTimeout(timeOut);

		timeOut = setTimeout(() => {
			updateTable(filterData(e.target.value, initialData));
		}, 500);
	};

	const updateFromFilter = (param: any) => {
		console.log(param);
		console.log('test fired');
	};

	// Filter table data
	const filterData = (inputValue: string, tableData: Array<any>) =>
		Object.values(tableData).filter((item: any) => compareValues(item, inputValue));

	// Compare values
	function compareValues(item: any, inputValue: string) {
		item = Object.values(item);

		let match: boolean;
		for (let i = 0; i < item.length; i++) {
			const content = item[i];
			const val = String(content);
			const input = inputValue.toLowerCase();
			const re = new RegExp(input, 'g');
			match = val.toLowerCase().match(re) != null;

			if (match) {
				return match;
			}
			continue;
		}
		return false;
	}

	return (
		<div className={styles.toolBarWrapper}>
			<div className="titleWrapper">
				<h1>endpoint</h1>
				<p className="subtext">somedomain.com/api/endpoint</p>
			</div>

			<div className={styles.toolsWrapper}>
				<input
					className={styles.search}
					type="search"
					name="search"
					placeholder="Search..."
					onChange={handleChange}
				/>
				<FilterButton dropdown={true} iconBefore={<FilterIcon />} onUpdate={updateFromFilter}>
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
}

function MainScreen() {
	const [tableData, setTableData] = useState(mockData);

	function handleChange(update: Array<any>) {
		setTableData([...update]);
	}

	return (
		<>
			<ToolBar updateTable={handleChange} initialData={mockData} />
			<Table updateTable={handleChange} tableData={tableData} headerData={mockData} />
		</>
	);
}

export const Home = ({ hasData }: { hasData: boolean }) => (
	<div id={styles.mainContentWrapper}>
		<SideBar hasData={hasData} />
		{hasData ? <MainScreen /> : <BlankSlate />}
	</div>
);
