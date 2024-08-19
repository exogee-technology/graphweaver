import { Link, useSearchParams } from 'react-router-dom';
import { Button } from '../button';
import { Popover, PopoverItem } from '../popover';
import { OpenExternalIcon } from '../assets/16-open-external';
import { decodeSearchParams, routeFor, useSelectedEntity } from '../utils';
import styles from './styles.module.css';

interface Props {
	title: string;
	subtitle: string;
	onExportToCSV?: () => void;
}

// @todo allow to be extended
const externalLinkItems: PopoverItem[] = [];

export const TitleBar = ({ title, subtitle, onExportToCSV }: Props) => {
	const [search] = useSearchParams();
	const { filters, sort } = decodeSearchParams(search);
	const { selectedEntity } = useSelectedEntity();

	if (!selectedEntity) throw new Error('There should always be a selected entity at this point.');

	return (
		<div className={styles.toolBarWrapper}>
			<div className="titleWrapper">
				<h1 className={styles.title}>{title}</h1>
				<p className="subtext">{subtitle}</p>
			</div>

			<div className={styles.toolsWrapper}>
				<Link
					to={{ pathname: '/playground' }}
					// If we are in an iframe then open in the same window otherwise open in a new tab
					target={window === window.parent ? '_blank' : '_self'}
					rel="noopener noreferrer"
					aria-label="Open Playground"
				>
					<Button>
						Open Playground
						<OpenExternalIcon />
					</Button>
				</Link>
				{onExportToCSV && (
					<Button className={styles.toolBarTrailingButton} onClick={onExportToCSV}>
						Export to CSV
					</Button>
				)}
				<Link
					className={styles.toolBarTrailingButton}
					to={routeFor({
						entity: selectedEntity,
						id: 'graphweaver-admin-new-entity',
						sort,
						filters,
					})}
					aria-label={`Create New ${selectedEntity.name}`}
				>
					<Button disabled={selectedEntity.attributes.isReadOnly}>
						Create New {selectedEntity.name}
					</Button>
				</Link>

				{externalLinkItems.length > 0 && <Popover items={externalLinkItems}>Links</Popover>}
			</div>
		</div>
	);
};
