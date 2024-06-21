import { ColumnDef, Row, createColumnHelper } from '@tanstack/react-table';

import { Span, UnixNanoTimeStamp } from '../utils';
import { Table } from '../table';
import { useNavigate } from 'react-router-dom';

const columnHelper = createColumnHelper<Span>();

const columns: ColumnDef<Span, any>[] = [
	columnHelper.accessor('timestamp', {
		cell: (info) => {
			const timestamp = UnixNanoTimeStamp.fromString(info.getValue());
			return <span>{timestamp.toDate().toLocaleString()}</span>;
		},
		header: () => 'Timestamp',
	}),
	columnHelper.accessor('name', {
		header: () => 'Name',
	}),
	columnHelper.accessor((row) => row.attributes?.type, {
		id: 'type',
		header: () => 'Type',
		cell: (info) => {
			const attributes = info.getValue();
			return attributes?.type ?? '';
		},
	}),
	columnHelper.accessor('duration', {
		header: () => 'Duration',
		cell: (info) => {
			const duration = UnixNanoTimeStamp.fromString(info.getValue());
			const { value, unit } = duration.toSIUnits();
			return (
				<span>
					{Number(value).toFixed(2)} {unit}
				</span>
			);
		},
	}),
	columnHelper.accessor('traceId', {
		header: () => 'Trace ID',
		cell: (info) => info.getValue(),
	}),
	columnHelper.accessor((row) => row.attributes?.method, {
		id: 'method',
		header: () => 'Method',
		cell: (info) => {
			const attributes = info.getValue();
			return attributes?.method ?? '';
		},
	}),
];

export const TraceTable = ({ traces }: { traces?: Span[] }) => {
	const navigate = useNavigate();

	if (!traces) {
		return <div>No traces found.</div>;
	}

	const handleRowClick = (row: Row<Span>) => {
		navigate(`/traces/${row.original.traceId}`);
	};

	return <Table data={traces} columns={columns} onRowClick={handleRowClick} />;
};
