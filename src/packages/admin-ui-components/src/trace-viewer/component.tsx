import { PanelGroup, Panel, PanelResizeHandle } from 'react-resizable-panels';

import { UnixNanoTimestamp } from '../utils/timestamp';
import { GraphQlViewer } from '../graphql-viewer';
import { JsonViewer } from '../json-viewer';
import { SpanView } from './span-view';
import { createTreeFromTrace } from '../utils';

import type { Span } from '../utils';

import styles from './styles.module.css';

export const TraceViewer = ({ traces }: { traces?: Span[] }) => {
	const spans = traces || [];
	const root = createTreeFromTrace(spans);

	const max = BigInt(spans.at(-1)?.timestamp ?? 0) + BigInt(spans.at(-1)?.duration ?? 0);

	const minTimestamp = UnixNanoTimestamp.fromString(spans[0].timestamp);
	const maxTimestamp = UnixNanoTimestamp.fromString(max.toString());

	const graphql = JSON.parse(String(root.attributes.body)) as { query: string; variables: string };

	return (
		<PanelGroup direction="vertical">
			<Panel maxSize={80}>
				<div className={styles.scrollContainer}>
					<div className={styles.spanListContainer}>
						<SpanView
							key={root.spanId}
							span={root}
							minTimestamp={minTimestamp}
							maxTimestamp={maxTimestamp}
						/>
					</div>
				</div>
			</Panel>
			<PanelResizeHandle className={styles.verticalHandle} />
			<Panel maxSize={80} defaultSize={40}>
				<PanelGroup direction="horizontal">
					<Panel>
						<GraphQlViewer graphql={graphql.query} />
					</Panel>
					<PanelResizeHandle className={styles.horizontalHandle} />
					<Panel maxSize={80} defaultSize={40}>
						<JsonViewer text={graphql.variables} />
					</Panel>
				</PanelGroup>
			</Panel>
			s
		</PanelGroup>
	);
};
