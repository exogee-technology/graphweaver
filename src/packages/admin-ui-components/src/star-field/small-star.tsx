import { DetailedHTMLProps, HTMLAttributes } from 'react';

export const SmallStar = (
	props: DetailedHTMLProps<HTMLAttributes<HTMLDivElement>, HTMLDivElement>
) => (
	<div {...props} style={{ ...props.style, backgroundColor: 'black' }}>
		<div
			style={{
				width: '100%',
				height: '100%',
				background:
					'radial-gradient(circle, #fff 0%, rgba(255, 255, 255, 0.8) 32%, rgba(255, 255, 255, 0.4) 60%, #000 70%)',
				borderRadius: '100%',
			}}
		></div>
	</div>
);
