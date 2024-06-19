import { useState } from 'react';

import { RenderTree } from './types';
import { UnixNanoTimeStamp } from '../utils/timestamp';
import { ChevronDownIcon } from '../assets';

import styles from './styles.module.css';
import { Spacer } from '../spacer';
import clsx from 'clsx';

export const SpanView = ({
	data,
	minTimestamp,
	maxTimestamp,
}: {
	data: RenderTree;
	minTimestamp: UnixNanoTimeStamp;
	maxTimestamp: UnixNanoTimeStamp;
}) => {
	const [showChildren, setShowChildren] = useState(false); // State to toggle children visibility

	const toggleChildren = () => data.children.length && setShowChildren(!showChildren);

	const durationNano = UnixNanoTimeStamp.fromString(data.duration);
	const startTimeUnixNano = UnixNanoTimeStamp.fromString(data.timestamp);

	const { width, offset } = durationNano.calculateWidthAndOffset(
		startTimeUnixNano,
		minTimestamp,
		maxTimestamp
	);

	const { value, unit } = durationNano.toSIUnits();

	return (
		<div className={styles.spanContainer}>
			<div
				className={styles.spanDisplayInfo}
				onClick={toggleChildren}
				role="button"
				aria-expanded={showChildren}
			>
				<div className={styles.spanRow}>
					{data.children.length > 0 && (
						<div className={styles.spanToggle}>
							{data.children.length}{' '}
							<span className={clsx(styles.chevron, !showChildren && styles.rotate)}>
								<ChevronDownIcon />
							</span>
						</div>
					)}
					<p className={styles.textContainer} data-info="span-info">
						<span className="font-bold" data-name="span-name">
							{data.name}
						</span>
					</p>
				</div>
				<Spacer height={8} />

				<div className={styles.spanProgressBarContainer}>
					<div className={styles.spanProgressBar} style={{ width, left: offset }}></div>
					<div className={styles.spanTime} style={{ left: offset }}>
						{Number(value).toFixed(2)} {unit}
					</div>
				</div>
			</div>

			{showChildren && (
				<div className={styles.spanChildren}>
					<div className={styles.spanChildrenLine}>
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
			)}
		</div>
	);
};
