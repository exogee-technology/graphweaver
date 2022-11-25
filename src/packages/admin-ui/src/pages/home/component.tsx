import { useState } from 'react';
import { SideBar, Table, Button, FilterButton } from '~/components';
import { ReactComponent as OpenPlaygroundIcon } from '~/assets/16-open-external.svg';
import { ReactComponent as FilterIcon } from '~/assets/16-filter.svg';
import { Entity } from '~/utils/use-schema';
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

export const Home = () => {
	const [selectedEntity, setSelectedEntity] = useState<Entity | undefined>();

	return (
		<div className={styles.wrapper}>
			<SideBar selectedEntity={selectedEntity} onEntitySelected={setSelectedEntity} />
			<div className={styles.content}>
				<ToolBar />
				<Table selectedEntity={selectedEntity} />
			</div>
		</div>
	);
};
