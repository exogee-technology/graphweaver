import { SVGProps } from 'react';

export const OpenExternalIcon = (props: SVGProps<SVGSVGElement>) => (
	<svg width="16" height="16" viewBox="0 0 16 16" fill="none" {...props}>
		<path
			d="M6.75714 9.24249L13.2424 2.75721M13.2424 2.75721L13.2424 7.41406M13.2424 2.75721L8.58556 2.75721"
			stroke="#EDE8F2"
			strokeWidth="2"
			strokeLinecap="round"
			strokeLinejoin="round"
		/>
		<path
			d="M13 11V11C13 12.6569 11.6569 14 10 14H5C3.34315 14 2 12.6569 2 11V6C2 4.34315 3.34315 3 5 3V3"
			stroke="#EDE8F2"
			strokeWidth="2"
			strokeLinecap="round"
			strokeLinejoin="round"
		/>
		<circle cx="13" cy="11" r="1" fill="#EDE8F2" />
		<circle cx="5" cy="3" r="1" fill="#EDE8F2" />
	</svg>
);
