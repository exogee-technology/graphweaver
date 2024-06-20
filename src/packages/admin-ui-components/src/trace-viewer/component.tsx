import { PanelGroup, Panel, PanelResizeHandle } from 'react-resizable-panels';

import { UnixNanoTimeStamp } from '../utils/timestamp';
import { GraphQlViewer } from '../graphql-viewer';
import { SpanView } from './span-view';
import { createTreeFromTrace } from '../utils';

import type { Span } from '../utils';

import styles from './styles.module.css';

export const TraceViewer = ({ traces }: { traces?: Span[] }) => {
	const spans = traces || [];
	const root = createTreeFromTrace(spans);

	const max = BigInt(spans.at(-1)?.timestamp ?? 0) + BigInt(spans.at(-1)?.duration ?? 0);

	const minTimestamp = UnixNanoTimeStamp.fromString(spans[0].timestamp);
	const maxTimestamp = UnixNanoTimeStamp.fromString(max.toString());

	const graphql = JSON.parse(String(root.attributes.body)) as { query: string };

	return (
		<PanelGroup direction="vertical">
			<Panel maxSize={80}>
				<div className={styles.scrollContainer}>
					<div className={styles.spanListContainer}>
						<SpanView
							key={root.id}
							span={root}
							minTimestamp={minTimestamp}
							maxTimestamp={maxTimestamp}
						/>
					</div>
				</div>
			</Panel>
			<PanelResizeHandle className={styles.handle} />
			<Panel maxSize={80} defaultSize={40}>
				<GraphQlViewer graphql={graphql.query} />
			</Panel>
		</PanelGroup>
	);
};
