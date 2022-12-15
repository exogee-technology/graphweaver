import { PointTooltip } from '@nivo/line';
import styles from './styles.module.css';

const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export const netProfitTooltip: PointTooltip = ({ point }) => {
	const date = new Date(point.data.xFormatted);

	return (
		<div className={styles.tooltipWrapper}>
			<h3>{point.serieId}</h3>
			<span>
				{months[date.getMonth()]} {date.getFullYear()}
			</span>
			<span>{point.data.yFormatted}</span>
		</div>
	);
};

export const rankingTooltip = () => <p>Stuff</p>;
