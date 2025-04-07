import { Checkbox, ComboBox, SelectMode } from '@exogee/graphweaver-admin-ui-components';
import { Dispatch, SetStateAction } from 'react';
import { LineChartControls } from '../line-chart/utils';
import { ChartColorScheme } from '../../utils';
import styles from './styles.module.css';

interface Props {
	controls: LineChartControls;
	setControls: Dispatch<SetStateAction<LineChartControls>>;
}

export const LineControls = (props: Props) => {
	const { controls, setControls } = props;

	const handleChange = (key: keyof LineChartControls, value: any) => {
		setControls((prevControls) => ({
			...prevControls,
			[key]: value,
		}));
	};

	return (
		<>
			<div className={styles.controlItem}>
				<label>Color scheme: </label>
				<ComboBox
					mode={SelectMode.SINGLE}
					options={Object.values(ChartColorScheme).map((value) => ({ value, label: value }))}
					onChange={(selected) => handleChange('colorScheme', selected[0].value)}
					value={{ value: controls.colorScheme }}
					placeholder="Select"
				/>
			</div>
			<div className={styles.controlItem}>
				<label>Curve: </label>
				<ComboBox
					mode={SelectMode.SINGLE}
					options={['linear', 'basis', 'cardinal', 'catmullRom'].map((value) => ({
						value,
						label: value,
					}))}
					onChange={(selected) => handleChange('curve', selected[0].value)}
					value={{ value: controls.curve }}
					placeholder="Select"
				/>
			</div>
			<div className={styles.checkBoxContainer}>
				<Checkbox
					id="enableArea"
					checked={controls.enableArea}
					onChange={(e) => handleChange('enableArea', (e.target as any).checked)}
				/>
				<label htmlFor="enableArea">Enable area</label>
			</div>
			<div className={styles.checkBoxContainer}>
				<Checkbox
					id="enablePoints"
					checked={controls.enablePoints}
					onChange={(e) => handleChange('enablePoints', (e.target as any).checked)}
				/>
				<label htmlFor="enablePoints">Enable points</label>
			</div>
			<div className={styles.checkBoxContainer}>
				<Checkbox
					id="enablePointLabel"
					checked={controls.enablePointLabel}
					onChange={(e) => handleChange('enablePointLabel', (e.target as any).checked)}
				/>
				<label htmlFor="enablePointLabel">Enable point label</label>
			</div>
			<div className={styles.checkBoxContainer}>
				<Checkbox
					id="enableGridX"
					checked={controls.enableGridX}
					onChange={(e) => handleChange('enableGridX', (e.target as any).checked)}
				/>
				<label htmlFor="enableGridX">Enable grid X</label>
			</div>
			<div className={styles.checkBoxContainer}>
				<Checkbox
					id="enableGridY"
					checked={controls.enableGridY}
					onChange={(e) => handleChange('enableGridY', (e.target as any).checked)}
				/>
				<label htmlFor="enableGridY">Enable grid Y</label>
			</div>
		</>
	);
};
