import { ReactComponent as GraphweaverLogo } from '~/assets/graphweaver-logo.svg';
import styles from './styles.module.css';
import { Entity, useSchema } from '~/utils/use-schema';
import { BackendRow } from './backend-row';

export const SideBar = ({
	selectedEntity,
	onEntitySelected,
}: {
	selectedEntity?: Entity;
	onEntitySelected?: (entity: Entity) => any;
}) => {
	const schema = useSchema();

	return (
		<div className={styles.sideBar}>
			<GraphweaverLogo width="52" className={styles.logo} />
			<p className={styles.subtext}>Data Sources</p>

			{schema.backends.map((backend) => (
				<BackendRow
					key={backend}
					backend={backend}
					selectedEntity={selectedEntity}
					onEntitySelected={onEntitySelected}
				/>
			))}
		</div>
	);
};
