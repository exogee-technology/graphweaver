import React, { useState } from 'react';
import { Meta } from '@storybook/react';
import { useDebounce } from './use-debounce';

const meta = {
	title: 'Hooks/useDebounce',
	parameters: {
		docs: {
			description: {
				component:
					'A React hook that debounces a value, useful for delaying API calls or expensive operations until user input has stopped for a specified period.',
			},
		},
	},
} as Meta;

export default meta;

// Example component showing how to use the hook
export const Example = () => {
	const [inputValue, setInputValue] = useState('');
	const [debouncedValue, setDebouncedValue] = useState('');

	// Use the debounce hook to delay updates to debouncedValue
	useDebounce(inputValue, setDebouncedValue, 500);

	return (
		<div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
			<div>
				<label htmlFor="debounce-input" style={{ display: 'block', marginBottom: '5px' }}>
					Type something (debounced with 500ms delay):
				</label>
				<input
					id="debounce-input"
					value={inputValue}
					onChange={(e) => setInputValue(e.target.value)}
					style={{
						padding: '8px',
						borderRadius: '4px',
						border: '1px solid #ccc',
						backgroundColor: '#2d2d2d',
						color: 'white',
						width: '100%',
						maxWidth: '300px',
					}}
					placeholder="Type here..."
				/>
			</div>

			<div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
				<div>
					<strong>Immediate value:</strong> {inputValue}
				</div>
				<div>
					<strong>Debounced value:</strong> {debouncedValue}
				</div>
				<div style={{ fontSize: '14px', color: '#aaa', marginTop: '5px' }}>
					The debounced value updates 500ms after you stop typing.
				</div>
			</div>
		</div>
	);
};

// Code snippet for documentation
Example.parameters = {
	docs: {
		source: {
			code: `
// Import the hook
import { useDebounce } from '@exogee/graphweaver-admin-ui-components';

// Inside your component
function SearchComponent() {
  // State for the immediate input value
  const [searchQuery, setSearchQuery] = useState('');
  
  // State for the debounced value (used for API calls)
  const [debouncedQuery, setDebouncedQuery] = useState('');
  
  // Apply the debounce with a 500ms delay
  useDebounce(searchQuery, setDebouncedQuery, 500);
  
  // Effect hook that triggers the API call when debouncedQuery changes
  useEffect(() => {
    if (debouncedQuery) {
      fetchSearchResults(debouncedQuery);
    }
  }, [debouncedQuery]);
  
  return (
    <input
      value={searchQuery}
      onChange={(e) => setSearchQuery(e.target.value)}
      placeholder="Search..."
    />
  );
}

// You can customize the debounce delay
function CustomDelayComponent() {
  const [value, setValue] = useState('');
  const [debouncedValue, setDebouncedValue] = useState('');
  
  // Use a longer 1000ms (1 second) delay
  useDebounce(value, setDebouncedValue, 1000);
  
  return (
    <input
      value={value}
      onChange={(e) => setValue(e.target.value)}
      placeholder="Longer delay..."
    />
  );
}
      `,
		},
	},
};
