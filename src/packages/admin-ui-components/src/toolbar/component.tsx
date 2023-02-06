// @todo: get a different icon for filterIcon
import { Button, ControlsIcon, FilterBar, FilterButton, FilterIcon, OpenExternalIcon } from '..';
import styles from './styles.module.css';

export const ToolBar = () => (
	<div className={styles.toolBarContainer}>
		<div className={styles.toolBarWrapper}>
			<div className="titleWrapper">
				<h1>localhost</h1>
				<p className="subtext">localhost:3000/graphql/v1</p>
			</div>

			<div className={styles.toolsWrapper}>
				<input className={styles.search} type="search" name="search" placeholder="Search..." />
				{/* <FilterButton dropdown iconBefore={<ControlsIcon />}>
					Filter
				</FilterButton> */}

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
		<FilterBar iconBefore={<FilterIcon />} />
	</div>
);
