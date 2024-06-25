import { useState } from 'react';

import { SpanTree } from '../utils';
import { UnixNanoTimeStamp } from '../utils';
import { ChevronDownIcon } from '../assets';

import styles from './styles.module.css';
import { Spacer } from '../spacer';
import clsx from 'clsx';

export const SpanView = ({
	span,
	minTimestamp,
	maxTimestamp,
}: {
	span: SpanTree;
	minTimestamp: UnixNanoTimeStamp;
	maxTimestamp: UnixNanoTimeStamp;
}) => {
	const [showChildren, setShowChildren] = useState(false); // State to toggle children visibility

	const toggleChildren = () => span.childrenCount && setShowChildren(!showChildren);

	const durationNano = UnixNanoTimeStamp.fromString(span.duration);
	const startTimeUnixNano = UnixNanoTimeStamp.fromString(span.timestamp);

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
					{span.childrenCount > 0 && (
						<div className={styles.spanToggle}>
							{span.childrenCount}{' '}
							<span className={clsx(styles.chevron, !showChildren && styles.rotate)}>
								<ChevronDownIcon />
							</span>
						</div>
					)}
					<p className={styles.textContainer} data-info="span-info">
						<span className="font-bold" data-name="span-name">
							{span.name}
						</span>
					</p>
				</div>
				<Spacer height={8} />

				<div className={styles.spanProgressBarContainer}>
					<div className={styles.spanProgressBar} style={{ width, left: `${offset}%` }}></div>
					<div
						className={clsx(styles.spanTime, offset >= 95 && styles.spanTimeRight)}
						style={offset < 95 ? { left: `${offset}%` } : {}}
					>
						{Number(value).toFixed(2)} {unit}
					</div>
				</div>
			</div>

			{showChildren && (
				<div className={styles.spanChildren}>
					<div className={styles.spanChildrenLine}>
						{Array.isArray(span.children)
							? span.children.map((child: any) => (
									<SpanView
										key={child.spanId}
										span={child}
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
