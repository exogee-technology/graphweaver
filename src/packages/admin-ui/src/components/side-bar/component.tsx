import { useState } from 'react';

import graphweaverLogo from '~/assets/graphweaver-logo.svg';
import databaseIcon16 from '~/assets/16-database.svg';
import styles from './styles.module.css';

const sideBarData = [
	{
		id: 1,
		name: 'database 1',
		children: [
			{
				id: 1,
				name: 'Sub 1',
			},
			{
				id: 2,
				name: 'Sub 2',
			},
			{
				id: 3,
				name: 'Sub 3',
			},
		],
	},
	{
		id: 2,
		name: 'database 2',
		children: [
			{
				id: 1,
				name: 'Sub 1',
			},
			{
				id: 2,
				name: 'Sub 2',
			},
			{
				id: 3,
				name: 'Sub 3',
			},
		],
	},
];

const SubListItem = ({
	child,
	active,
	handleClick,
}: {
	child: any;
	handleClick?: () => any;
	active: string;
}) => (
	<li>
		<a
			onClick={(e) => {
				e.preventDefault();
				handleClick?.();
			}}
			className={`${styles.subListItem} ${active}`}
			href="/#"
		>
			<span></span>
			{child.name}
		</a>
	</li>
);

function SideBarEntity() {
	const [activeSubItem, setActiveSubItem] = useState(-1);
	const [entityExpandedState, setEntityExpandedState] = useState(sideBarData);

	function expandContractEntity(entity: any) {
		const newentityExpandedState = entityExpandedState.map((menuItem: any) => {
			if (menuItem.id === entity.id) {
				return {
					...menuItem,
					expanded: !('expanded' in menuItem) ? true : !menuItem.expanded,
				};
			} else {
				return { ...menuItem, expanded: false };
			}
		});

		setEntityExpandedState(newentityExpandedState);
	}

	return (
		<>
			{entityExpandedState.map((entity: any) => (
				<ul key={entity.id} className={styles.entity}>
					<li className={entity.expanded ? styles.open : styles.closed}>
						<a
							href="/#"
							onClick={(e) => {
								e.preventDefault();
								expandContractEntity(entity);
							}}
						>
							<span>
								<img height={16} src={databaseIcon16} alt="Database icon" />
							</span>
							{entity.name}
						</a>
						<ul>
							{entity.children.map((child: any) => (
								<SubListItem
									handleClick={() => setActiveSubItem(child.id)}
									active={activeSubItem === child.id ? styles.active : 'not-active'}
									key={child.id}
									child={child}
								/>
							))}
						</ul>
					</li>
				</ul>
			))}
		</>
	);
}

const DataSources = () => (
	<div id={styles.sideBarMenu}>
		<img className={styles.logo} width="52" src={graphweaverLogo} alt="Graphweaver logo." />
		<p className={styles.subtext}>Data sources</p>
		<SideBarEntity />
	</div>
);

const BlankSlate = () => (
	<div id={styles.sideBar}>
		<div className={styles.blankSlate}>
			<img width="52" src={graphweaverLogo} alt="No database yet, add one." />
		</div>
	</div>
);

export const SideBar = ({ hasData }: { hasData: boolean }) =>
	hasData ? <DataSources /> : <BlankSlate />;
