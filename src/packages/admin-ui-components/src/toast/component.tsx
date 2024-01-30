import { SuccessCheckmark, CloseIcon } from '../assets';
import { toast, ToastBar, Toaster } from 'react-hot-toast';

import styles from './styles.module.css';

export const DismissibleToast = () => {
	return (
		<div>
			<Toaster
				position="top-center"
				toastOptions={{
					position: 'bottom-right',
					className: styles.toastContainer,
					style: {
						borderRadius: '6px',
						padding: '8px 16px',
					},
					success: {
						duration: 300_000,
						icon: <SuccessCheckmark className={styles.successIcon} />,
						style: {
							background: '#302A3C',
							color: 'white',
						},
					},
					error: {
						duration: 100_000,
						icon: <span />, // don't show an icon
						style: {
							background: '#A01738',
							color: 'white',
						},
					},
				}}
			>
				{(t) => (
					<ToastBar toast={t}>
						{({ icon, message }) => (
							<>
								<div className={styles.iconContainer}>{icon}</div>
								{/* Start here, this message includes the 'Success' and the message set by the implmented toast. Can I seperate them? */}
								{message}
								{t.type !== 'loading' && (
									<div className={styles.iconContainer} onClick={() => toast.dismiss(t.id)}>
										<CloseIcon />
									</div>
								)}
							</>
						)}
					</ToastBar>
				)}
			</Toaster>
		</div>
	);
};
