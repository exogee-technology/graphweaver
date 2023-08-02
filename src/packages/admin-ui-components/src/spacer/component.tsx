import classNames from 'classnames';

type SpacerProps = {
	height?: number;
	width?: number;
	grow?: number;
	shrink?: number;
	flex?: number;
	className?: string;
};

export const Spacer = ({ height, width, flex = 1, grow, shrink, className }: SpacerProps) => {
	const style = {
		flex: flex,
		flexGrow: grow,
		flexShrink: shrink,
	};

	const heightStyle = {
		minHeight: `${height}px`,
		height: `${height}px`,
		maxHeight: `${height}px`,
	};

	const widthStyle = {
		minWidth: `${width}px`,
		width: `${width}px`,
		maxWidth: `${width}px`,
	};

	const styles = {
		...style,
		...(height && heightStyle),
		...(width && widthStyle),
	};

	const classNamesArray = className ? [className] : [];

	return <div style={styles} className={classNames(classNamesArray)} />;
};
