import { RenderTree } from '../types';

import styles from '../styles.module.css';
import { UnixNanoTimeStamp } from '../util/timestamp';

export const SpanView = ({
	data,
	minTimestamp,
	maxTimestamp,
}: {
	data: RenderTree;
	minTimestamp: UnixNanoTimeStamp;
	maxTimestamp: UnixNanoTimeStamp;
}) => {
	const durationNano = UnixNanoTimeStamp.fromString(data.duration);
	const startTimeUnixNano = UnixNanoTimeStamp.fromString(data.timestamp);

	const { width, offset } = durationNano.calculateWidthAndOffset(
		startTimeUnixNano,
		minTimestamp,
		maxTimestamp
	);

	const { value, unit } = durationNano.toSIUnits();

	const displyInfo = (
		<p className={styles.textContainer} data-info="span-info">
			<span className="font-bold" data-name="span-name">
				{data.name}
			</span>
			{' - '}
			<span className="font-light" data-time="span-time">
				{Number(value).toFixed(2)} {unit}
			</span>
		</p>
	);

	return (
		<div className={styles.spanContainer}>
			<div className={styles.spanDisplayInfo}>
				{displyInfo}
				<div className={styles.spanProgressBarContainer}>
					<div className={styles.spanProgressBar} style={{ width, left: offset }}></div>
				</div>
			</div>

			<div className={styles.spanChildren}>
				{Array.isArray(data.children)
					? data.children.map((child: any) => (
							<SpanView
								key={child.id}
								data={child}
								minTimestamp={minTimestamp}
								maxTimestamp={maxTimestamp}
							/>
						))
					: null}
			</div>
		</div>
	);
};
