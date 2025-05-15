import React, { useState } from 'react';
import { Meta } from '@storybook/react';
import { useAutoFocus } from './use-auto-focus';

const meta = {
	title: 'Hooks/useAutoFocus',
	parameters: {
		docs: {
			description: {
				component: 'A React hook that automatically focuses an element after it mounts.',
			},
		},
	},
} as Meta;

export default meta;

// Example component showing how to use the hook
export const Example = () => {
	const [showInput, setShowInput] = useState(false);
	const inputRef = useAutoFocus<HTMLInputElement>(true);

	return (
		<div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
			<div>
				<button
					onClick={() => setShowInput(!showInput)}
					style={{
						padding: '8px 16px',
						backgroundColor: '#6200ee',
						color: 'white',
						border: 'none',
						borderRadius: '4px',
					}}
				>
					{showInput ? 'Hide' : 'Show'} Input
				</button>
			</div>

			{showInput && (
				<div>
					<label htmlFor="focused-input" style={{ display: 'block', marginBottom: '5px' }}>
						This input will be focused automatically:
					</label>
					<input
						id="focused-input"
						ref={inputRef}
						style={{
							padding: '8px',
							borderRadius: '4px',
							border: '1px solid #ccc',
							backgroundColor: '#2d2d2d',
							color: 'white',
						}}
						placeholder="I'll be focused!"
					/>
				</div>
			)}
		</div>
	);
};

// Code snippet for documentation
Example.parameters = {
	docs: {
		source: {
			code: `
// Import the hook
import { useAutoFocus } from '@exogee/graphweaver-admin-ui-components';

// Inside your component
function MyComponent() {
  // Pass true to enable auto-focusing
  const inputRef = useAutoFocus<HTMLInputElement>(true);
  
  return (
    <input
      ref={inputRef}
      placeholder="This will be focused automatically"
    />
  );
}

// You can conditionally enable auto-focus
function ConditionalFocus({ shouldFocus }) {
  const inputRef = useAutoFocus<HTMLInputElement>(shouldFocus);
  
  return (
    <input
      ref={inputRef}
      placeholder="Will focus if shouldFocus is true"
    />
  );
}
      `,
		},
	},
};
