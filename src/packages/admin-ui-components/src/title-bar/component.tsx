import { Link, useSearchParams } from 'wouter';
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
			<div className={styles.titleWrapper}>
				<h1 className={styles.title}>{title}</h1>
				<p className="subtext">{subtitle}</p>
			</div>

			<div className={styles.toolsWrapper}>
				{/* By default we want to open in a new window. <Link /> doesn't do that for us.
				    But when we're in an iframe, we can't open a new window, so we just clobber. */}
				{window.self === window.top ? (
					<a
						href="/playground"
						target="_blank"
						rel="noopener noreferrer"
						aria-label="Open Playground"
					>
						<Button>
							Open Playground
							<OpenExternalIcon />
						</Button>
					</a>
				) : (
					<Link to="/playground" aria-label="Open Playground">
						<Button>
							Open Playground
							<OpenExternalIcon />
						</Button>
					</Link>
				)}

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
					<Button disabled={selectedEntity.attributes.isReadOnly} className={styles.createButton}>
						Create New {selectedEntity.name}
					</Button>
				</Link>

				{externalLinkItems.length > 0 && <Popover items={externalLinkItems}>Links</Popover>}
			</div>
		</div>
	);
};
