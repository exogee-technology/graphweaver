import { useState } from 'react';

import { ReactComponent as GraphweaverLogo } from '~/assets/graphweaver-logo.svg';
import { ReactComponent as DatabaseIcon } from '~/assets/16-database.svg';
import { ReactComponent as TableIcon } from '~/assets/16-table.svg';
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
			<TableIcon />
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
								<DatabaseIcon />
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

export const SideBar = () => (
	<div className={styles.sideBar}>
		<GraphweaverLogo width="52" className={styles.logo} />
		<p className={styles.subtext}>Data sources</p>
		<SideBarEntity />
	</div>
);
