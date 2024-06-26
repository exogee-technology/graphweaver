import { SVGProps } from 'react';

export const LargeStar = (props: SVGProps<SVGSVGElement>) => (
	<svg fill="none" viewBox="0 0 25 25" {...props}>
		<g style={{ mixBlendMode: 'color-dodge' }}>
			<rect width="25" height="25" fill="#000" />
			<ellipse
				transform="rotate(-90 12.5 12.5)"
				cx="12.5"
				cy="12.5"
				rx="1.3298"
				ry="12.5"
				fill="url(#b)"
			/>
			<ellipse
				transform="rotate(180 12.5 12.5)"
				cx="12.5"
				cy="12.5"
				rx="1.3298"
				ry="12.5"
				fill="url(#a)"
			/>
		</g>
		<defs>
			<radialGradient
				id="b"
				cx="0"
				cy="0"
				r="1"
				gradientTransform="translate(12.5 12.5) rotate(90) scale(12.5 1.3298)"
				gradientUnits="userSpaceOnUse"
			>
				<stop stopColor="#fff" offset=".14583" />
				<stop stopColor="#fff" stopOpacity="0" offset="1" />
			</radialGradient>
			<radialGradient
				id="a"
				cx="0"
				cy="0"
				r="1"
				gradientTransform="translate(12.5 12.5) rotate(90) scale(12.5 1.3298)"
				gradientUnits="userSpaceOnUse"
			>
				<stop stopColor="#fff" offset=".14583" />
				<stop stopColor="#fff" stopOpacity="0" offset="1" />
			</radialGradient>
		</defs>
	</svg>
);
