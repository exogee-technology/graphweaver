# `@exogee/graphweaver-admin-ui-components`

UI components used in the Admin UI which you can also import and use in your project as you like.

## <Button />

A themed button

```tsx
import { Button } from '@exogee/graphweaver-admin-ui-components';
import { MyIcon } from './icon';

const MyPage = () => {
	const handleOnClick = () => alert('Button Was Clicked');

	return (
		<>
			<Button renderAfter={() => <MyIcon />} onClick={handleOnClickButton}>
				A Button Label
			</Button>
		</>
	);
};
```

## <Popover />

A Popover Menu

```tsx
import { PopoverItem, Popover } from '@exogee/graphweaver-admin-ui-components';

const MyPage = () => {
	const externalLinkItems: PopoverItem[] = [];

	return <Popover items={externalLinkItems}>Links</Popover>;
};
```

## Documentation

Comprehensive documentation and usage examples can be found on our [Docs Site](https://graphweaver.com/docs). It covers installation instructions, detailed API documentation, and guides to help you get started with Graphweaver.

## Graphweaver CLI `graphweaver`

The Graphweaver Command Line Interface (CLI) tool enables you to set up and manage Graphweaver using commands in your command-line shell. Check the `graphweaver` npm package [here.](https://www.npmjs.com/package/graphweaver)
