import { useParams } from 'react-router-dom';

import { useSchema } from '../utils';
import { ToolBar } from '../toolbar';

interface ListToolBarProps {
	count?: number;
	onExportToCSV?: () => void;
}

export const ListToolBar = ({ count, onExportToCSV }: ListToolBarProps) => {
	const { entity } = useParams();
	const { entityByName } = useSchema();

	let subtitle = '';
	if (entity && entityByName(entity)) {
		subtitle = `From ${entityByName(entity).backendDisplayName ?? entityByName(entity).backendId}`;
	}
	if (typeof count === 'number') {
		if (subtitle) subtitle += ' ';
		subtitle += `(${count} row${count === 1 ? '' : 's'})`;
	}

	return (
		<ToolBar
			title={entity ?? 'Unknown Entity'}
			subtitle={subtitle}
			onExportToCSV={() => onExportToCSV?.()}
		/>
	);
};
