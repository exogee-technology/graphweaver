import { SVGProps } from 'react';

export const Arrow = (props: SVGProps<SVGSVGElement>) => (
	<svg fill="none" viewBox="0 0 10 8" {...props}>
		<path
			d="m1 4h8m0 0-3 3m3-3-3-3"
			stroke={props.color ?? '#fff'}
			strokeLinecap="round"
			strokeLinejoin="round"
			strokeWidth="1.5"
		/>
	</svg>
);
