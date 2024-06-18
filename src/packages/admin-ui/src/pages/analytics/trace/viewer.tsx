import { SpanView } from './span';
import type { RenderTree, Span, Trace } from '../types';

import styles from '../styles.module.css';
import { UnixNanoTimeStamp } from '../util/timestamp';

export const createTreeData = (spanArray: Span[]): RenderTree[] => {
	const treeData: RenderTree[] = [];
	const lookup: { [key: string]: RenderTree } = {};

	spanArray.forEach((span) => {
		lookup[span.id] = {
			...span,
			children: [],
		};

		if (span.parentId) {
			lookup[span.parentId]?.children?.push(lookup[span.id]);
		} else {
			treeData.push(lookup[span.id]);
		}
	});

	return treeData;
};

export const TraceViewer = ({ trace }: { trace?: Trace }) => {
	const spans = trace?.traces || [];
	const treeData = createTreeData(spans);

	const max = BigInt(spans.at(-1)?.timestamp ?? 0) + BigInt(spans.at(-1)?.duration ?? 0);

	const minTimestamp = UnixNanoTimeStamp.fromString(spans[0].timestamp);
	const maxTimestamp = UnixNanoTimeStamp.fromString(max.toString());

	return (
		<div className={styles.scrollContainer}>
			<div className={styles.spanListContainer}>
				{treeData.map((treeItem) => (
					<SpanView
						key={treeItem.id}
						data={treeItem}
						minTimestamp={minTimestamp}
						maxTimestamp={maxTimestamp}
					/>
				))}
			</div>
		</div>
	);
};
