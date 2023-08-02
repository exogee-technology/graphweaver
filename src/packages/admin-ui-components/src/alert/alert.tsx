import classNames from 'classnames';
import { ReactNode } from 'react';
import { ErrorIcon, WarningIcon, InfoIcon, SuccessIcon } from '../assets';
import { Spacer } from '../spacer';
import styles from './styles.module.css';

export interface AlertProps {
	severity?: 'error' | 'warning' | 'info' | 'success';
	children?: ReactNode;
}

export const Alert = ({ severity = 'error', children }: AlertProps): JSX.Element => {
	const severityClass = {
		['error']: styles.error,
		['warning']: styles.warning,
		['info']: styles.info,
		['success']: styles.success,
	};

	const severityIcon = {
		['error']: <ErrorIcon />,
		['warning']: <WarningIcon />,
		['info']: <InfoIcon />,
		['success']: <SuccessIcon />,
	};

	return (
		<div className={classNames(styles.container, severityClass[severity])}>
			{severityIcon[severity]}
			<Spacer width={10} />
			<div className={styles.message}>{children}</div>
		</div>
	);
};
